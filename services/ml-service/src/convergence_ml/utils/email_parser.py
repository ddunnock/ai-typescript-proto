"""Email parsing utilities for extracting content from email messages.

This module provides functions for parsing email content, extracting
headers, and handling various email formats (plain text and HTML).

Example:
    >>> from convergence_ml.utils.email_parser import parse_email
    >>> content = parse_email(raw_email)
    >>> print(content.subject)
    'Meeting Tomorrow'
"""

from __future__ import annotations

import email
import re
from dataclasses import dataclass, field
from email.message import Message
from typing import TYPE_CHECKING

from convergence_ml.core.logging import get_logger
from convergence_ml.utils.text_preprocessing import clean_text, strip_html

if TYPE_CHECKING:
    from typing import Any  # noqa: F401 - Used for type checking

logger = get_logger(__name__)


@dataclass
class EmailContent:
    """Parsed email content.

    Contains extracted information from an email message.

    Attributes:
        subject: Email subject line.
        from_address: Sender email address.
        from_name: Sender display name.
        to_addresses: List of recipient addresses.
        cc_addresses: List of CC addresses.
        date: Email date as string.
        body_text: Plain text body content.
        body_html: HTML body content (if available).
        attachments: List of attachment filenames.
        headers: Dictionary of email headers.
        message_id: Unique message identifier.
        in_reply_to: Message ID of parent email.
        references: List of referenced message IDs.

    Example:
        >>> content = EmailContent(
        ...     subject="Hello",
        ...     from_address="sender@example.com",
        ...     body_text="This is the message body."
        ... )
    """

    subject: str = ""
    from_address: str = ""
    from_name: str = ""
    to_addresses: list[str] = field(default_factory=list)
    cc_addresses: list[str] = field(default_factory=list)
    date: str = ""
    body_text: str = ""
    body_html: str = ""
    attachments: list[str] = field(default_factory=list)
    headers: dict[str, str] = field(default_factory=dict)
    message_id: str = ""
    in_reply_to: str = ""
    references: list[str] = field(default_factory=list)

    @property
    def body(self) -> str:
        """Get the best available body content.

        Returns plain text if available, otherwise stripped HTML.

        Returns:
            Body text content.
        """
        if self.body_text:
            return self.body_text
        elif self.body_html:
            return strip_html(self.body_html, preserve_structure=True)
        return ""

    @property
    def clean_body(self) -> str:
        """Get cleaned body text suitable for ML processing.

        Returns:
            Cleaned body text.
        """
        return clean_text(self.body)


def parse_email(raw_email: str | bytes) -> EmailContent:
    """Parse a raw email message into structured content.

    Handles both plain text and multipart emails, extracting
    text and HTML body content.

    Args:
        raw_email: Raw email content as string or bytes.

    Returns:
        EmailContent with extracted information.

    Example:
        >>> content = parse_email(raw_email_string)
        >>> print(f"From: {content.from_address}")
        >>> print(f"Subject: {content.subject}")
        >>> print(f"Body: {content.body[:100]}...")
    """
    # Parse the email
    if isinstance(raw_email, bytes):
        msg = email.message_from_bytes(raw_email)
    else:
        msg = email.message_from_string(raw_email)

    # Extract headers
    headers = parse_email_headers(msg)

    # Extract body content
    body_text, body_html, attachments = _extract_body(msg)

    # Parse from address
    from_addr, from_name = _parse_address(msg.get("From", ""))

    # Parse recipients
    to_addrs = _parse_address_list(msg.get("To", ""))
    cc_addrs = _parse_address_list(msg.get("Cc", ""))

    # Parse references
    references = []
    refs = msg.get("References", "")
    if refs:
        references = re.findall(r"<[^>]+>", refs)

    return EmailContent(
        subject=_decode_header(msg.get("Subject", "")),
        from_address=from_addr,
        from_name=from_name,
        to_addresses=to_addrs,
        cc_addresses=cc_addrs,
        date=msg.get("Date", ""),
        body_text=body_text,
        body_html=body_html,
        attachments=attachments,
        headers=headers,
        message_id=msg.get("Message-ID", ""),
        in_reply_to=msg.get("In-Reply-To", ""),
        references=references,
    )


def parse_email_headers(msg: Message) -> dict[str, str]:
    """Extract headers from an email message.

    Args:
        msg: Email message object.

    Returns:
        Dictionary of header name to value.

    Example:
        >>> headers = parse_email_headers(message)
        >>> print(headers.get("X-Priority"))
    """
    headers = {}
    for key, value in msg.items():
        decoded = _decode_header(value)
        headers[key] = decoded
    return headers


def _extract_body(msg: Message) -> tuple[str, str, list[str]]:
    """Extract body content and attachments from email.

    Args:
        msg: Email message object.

    Returns:
        Tuple of (text_body, html_body, attachments).
    """
    if msg.is_multipart():
        return _extract_multipart_body(msg)
    else:
        return _extract_simple_body(msg)


def _extract_multipart_body(msg: Message) -> tuple[str, str, list[str]]:
    """Extract body from multipart email.

    Args:
        msg: Email message object.

    Returns:
        Tuple of (text_body, html_body, attachments).
    """
    text_body = ""
    html_body = ""
    attachments: list[str] = []

    for part in msg.walk():
        content_type = part.get_content_type()
        disposition = str(part.get("Content-Disposition", ""))

        # Handle attachments
        if "attachment" in disposition:
            filename = part.get_filename()
            if filename:
                attachments.append(_decode_header(filename))
            continue

        # Extract text content
        if content_type == "text/plain" and not text_body:
            text_body = _decode_part_payload(part)

        # Extract HTML content
        elif content_type == "text/html" and not html_body:
            html_body = _decode_part_payload(part)

    return text_body.strip(), html_body.strip(), attachments


def _extract_simple_body(msg: Message) -> tuple[str, str, list[str]]:
    """Extract body from simple non-multipart email.

    Args:
        msg: Email message object.

    Returns:
        Tuple of (text_body, html_body, attachments).
    """
    content_type = msg.get_content_type()
    payload = msg.get_payload(decode=True)

    if not isinstance(payload, bytes):
        return "", "", []

    content = _decode_payload(payload, msg.get_content_charset())

    if content_type == "text/html":
        return "", content.strip(), []
    else:
        return content.strip(), "", []


def _decode_part_payload(part: Message) -> str:
    """Decode payload from an email part.

    Args:
        part: Email message part.

    Returns:
        Decoded text content.
    """
    payload = part.get_payload(decode=True)
    if isinstance(payload, bytes):
        return _decode_payload(payload, part.get_content_charset())
    return ""


def _decode_payload(payload: bytes, charset: str | None) -> str:
    """Decode bytes payload with fallback encoding.

    Args:
        payload: Bytes payload.
        charset: Charset to use for decoding.

    Returns:
        Decoded string.
    """
    charset = charset or "utf-8"
    try:
        return payload.decode(charset, errors="replace")
    except Exception:
        return payload.decode("utf-8", errors="replace")


def _decode_header(header_value: str) -> str:
    """Decode an email header value.

    Handles encoded headers (RFC 2047).

    Args:
        header_value: Raw header value.

    Returns:
        Decoded header string.
    """
    if not header_value:
        return ""

    try:
        decoded_parts = email.header.decode_header(header_value)
        decoded_str = ""

        for part, charset in decoded_parts:
            if isinstance(part, bytes):
                decoded_str += part.decode(charset or "utf-8", errors="replace")
            else:
                decoded_str += part

        return decoded_str.strip()
    except Exception:
        return str(header_value).strip()


def _parse_address(address_str: str) -> tuple[str, str]:
    """Parse an email address into address and display name.

    Args:
        address_str: Address string like "Name <email@example.com>".

    Returns:
        Tuple of (email_address, display_name).
    """
    if not address_str:
        return ("", "")

    address_str = _decode_header(address_str)

    # Try to parse "Name <email>" format
    # SECURITY: This regex is safe from ReDoS as it uses non-backtracking patterns
    # with single quantifiers and bounded character classes
    match = re.match(r"^(.+?)\s*<([^>]+)>", address_str)
    if match:
        name = match.group(1).strip().strip('"')
        addr = match.group(2).strip()
        return (addr, name)

    # Try to parse "<email>" format
    match = re.match(r"^<([^>]+)>", address_str)
    if match:
        return (match.group(1).strip(), "")

    # Assume it's just an email address
    return (address_str.strip(), "")


def _parse_address_list(addresses_str: str) -> list[str]:
    """Parse a comma-separated list of email addresses.

    Args:
        addresses_str: Comma-separated addresses.

    Returns:
        List of email addresses.
    """
    if not addresses_str:
        return []

    addresses_str = _decode_header(addresses_str)
    address_tokens = _split_addresses_by_comma(addresses_str)

    return _extract_addresses_from_tokens(address_tokens)


def _split_addresses_by_comma(addresses_str: str) -> list[str]:
    """Split address string by comma, respecting quoted sections.

    Args:
        addresses_str: Comma-separated addresses.

    Returns:
        List of address tokens.
    """
    tokens = []
    current = ""
    in_quotes = False

    for char in addresses_str:
        if char == '"':
            in_quotes = not in_quotes
            current += char
        elif char == "," and not in_quotes:
            if current.strip():
                tokens.append(current.strip())
            current = ""
        else:
            current += char

    # Add the last token
    if current.strip():
        tokens.append(current.strip())

    return tokens


def _extract_addresses_from_tokens(tokens: list[str]) -> list[str]:
    """Extract email addresses from parsed tokens.

    Args:
        tokens: List of address tokens.

    Returns:
        List of email addresses.
    """
    addresses = []
    for token in tokens:
        addr, _ = _parse_address(token)
        if addr:
            addresses.append(addr)
    return addresses


def extract_reply_content(body: str) -> str:
    """Extract the new content from a reply email.

    Attempts to remove quoted reply content, leaving only
    the new message content.

    Args:
        body: Email body text.

    Returns:
        Body with quoted content removed.

    Example:
        >>> new_content = extract_reply_content(reply_body)
        >>> print(new_content)  # Just the new reply, not quoted original
    """
    if not body:
        return ""

    lines = body.split("\n")
    result_lines = []
    in_quote = False

    for line in lines:
        # Detect quote markers
        if line.startswith(">") or line.startswith("| "):
            in_quote = True
            continue

        # Detect "On ... wrote:" lines
        if re.match(r"^On .+wrote:$", line.strip()):
            in_quote = True
            continue

        # Detect "From: ..." headers that start quoted sections
        if re.match(r"^(From|Sent|To|Subject):", line.strip()) and any(
            re.match(r"^(From|Sent|To|Subject):", line_item.strip())
            for line_item in lines[lines.index(line) : lines.index(line) + 4]
            if line_item.strip()
        ):
            break

        if not in_quote:
            result_lines.append(line)

    return "\n".join(result_lines).strip()


def get_thread_info(content: EmailContent) -> dict[str, str | list[str] | bool | int]:
    """Extract threading information from parsed email.

    Args:
        content: Parsed email content.

    Returns:
        Dictionary with thread-related information.

    Example:
        >>> info = get_thread_info(parsed_email)
        >>> print(f"In reply to: {info['in_reply_to']}")
    """
    return {
        "message_id": content.message_id,
        "in_reply_to": content.in_reply_to,
        "references": content.references,
        "is_reply": bool(content.in_reply_to),
        "thread_length": len(content.references) + 1,
    }

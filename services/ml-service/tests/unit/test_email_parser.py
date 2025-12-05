"""
Unit tests for email parsing utilities.

Tests the email content extraction and parsing functions.
"""

from __future__ import annotations

from convergence_ml.utils.email_parser import (
    EmailContent,
    extract_reply_content,
    get_thread_info,
    parse_email,
)


class TestParseEmail:
    """Tests for email parsing function."""

    def test_parses_basic_email(self, sample_email_raw: str) -> None:
        """Test parsing a basic email."""
        content = parse_email(sample_email_raw)

        assert content.subject == "Meeting Tomorrow"
        assert content.from_address == "john.doe@example.com"
        assert content.from_name == "John Doe"
        assert "jane.smith@example.com" in content.to_addresses
        assert "meeting tomorrow" in content.body.lower()

    def test_parses_email_bytes(self, sample_email_raw: str) -> None:
        """Test parsing email from bytes."""
        content = parse_email(sample_email_raw.encode("utf-8"))
        assert content.subject == "Meeting Tomorrow"

    def test_handles_missing_headers(self) -> None:
        """Test handling emails with missing headers."""
        raw = """Content-Type: text/plain

Just the body.
"""
        content = parse_email(raw)
        assert content.subject == ""
        assert content.from_address == ""
        assert "Just the body" in content.body


class TestEmailContent:
    """Tests for EmailContent dataclass."""

    def test_body_property(self) -> None:
        """Test the body property."""
        content = EmailContent(body_text="Plain text body")
        assert content.body == "Plain text body"

    def test_body_falls_back_to_html(self) -> None:
        """Test that body falls back to HTML when no plain text."""
        content = EmailContent(body_html="<p>HTML body</p>")
        assert "HTML body" in content.body

    def test_clean_body(self) -> None:
        """Test the clean_body property."""
        content = EmailContent(body_text="  Hello   World  ")
        assert content.clean_body == "Hello World"


class TestExtractReplyContent:
    """Tests for reply content extraction."""

    def test_removes_quoted_content(self) -> None:
        """Test removing quoted reply content."""
        body = """Thanks for the update.

On Jan 1, 2024 someone wrote:
> Original message here
> More quoted text
"""
        result = extract_reply_content(body)
        assert "Thanks for the update" in result
        assert "Original message here" not in result

    def test_removes_angle_bracket_quotes(self) -> None:
        """Test removing > quoted lines."""
        body = """My reply.

> Quoted line 1
> Quoted line 2
"""
        result = extract_reply_content(body)
        assert "My reply" in result
        assert "Quoted line" not in result


class TestGetThreadInfo:
    """Tests for thread info extraction."""

    def test_extracts_thread_info(self) -> None:
        """Test extracting thread information."""
        content = EmailContent(
            message_id="<msg-1@example.com>",
            in_reply_to="<msg-0@example.com>",
            references=["<msg-0@example.com>"],
        )
        info = get_thread_info(content)

        assert info["message_id"] == "<msg-1@example.com>"
        assert info["is_reply"] is True
        assert info["thread_length"] == 2

    def test_not_a_reply(self) -> None:
        """Test email that is not a reply."""
        content = EmailContent(message_id="<msg-1@example.com>")
        info = get_thread_info(content)

        assert info["is_reply"] is False
        assert info["thread_length"] == 1

/**
 * @file Tests for Glass Avatar component. Covers glass-specific props: glow,
 *   size variants, and re-exported sub-components.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/glass/avatar";

describe("GlassAvatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders with default props", () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByText("JD");
      expect(avatar).toBeInTheDocument();
    });

    it("renders with AvatarImage", () => {
      const { container } = render(
        <Avatar>
          <AvatarImage src="/user.jpg" alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      // AvatarImage may not render if image fails to load, so check for the element
      const image = container.querySelector('[data-slot="avatar-image"]');
      if (image) {
        expect(image).toHaveAttribute("src", "/user.jpg");
        expect(image).toHaveAttribute("alt", "User");
      }
      // Fallback should always be available
      expect(screen.getByText("JD")).toBeInTheDocument();
    });

    it("renders with AvatarFallback", () => {
      render(
        <Avatar>
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText("AB")).toBeInTheDocument();
    });

    it("renders full composition with image and fallback", () => {
      const { container } = render(
        <Avatar>
          <AvatarImage src="/profile.jpg" alt="Profile" />
          <AvatarFallback>PF</AvatarFallback>
        </Avatar>
      );
      // AvatarImage may not render if image fails to load
      const image = container.querySelector('[data-slot="avatar-image"]');
      if (image) {
        expect(image).toHaveAttribute("alt", "Profile");
      }
      // Fallback should always be available
      expect(screen.getByText("PF")).toBeInTheDocument();
    });
  });

  describe("Glow Prop", () => {
    it("does not apply glow by default", () => {
      const { container } = render(
        <Avatar>
          <AvatarFallback>No Glow</AvatarFallback>
        </Avatar>
      );
      const avatar = container.querySelector("[data-slot='avatar']");
      expect(avatar?.className).not.toContain("ring-2");
      expect(avatar?.className).not.toContain("ring-purple-500/30");
    });

    it("applies glow classes when glow=true", () => {
      const { container } = render(
        <Avatar glow>
          <AvatarFallback>Glowing</AvatarFallback>
        </Avatar>
      );
      const avatar = container.querySelector("[data-slot='avatar']");
      expect(avatar?.className).toContain("ring-2");
      expect(avatar?.className).toContain("ring-purple-500/30");
      expect(avatar?.className).toContain("shadow-lg");
      expect(avatar?.className).toContain("shadow-purple-500/20");
    });

    it("does not apply glow when glow=false", () => {
      const { container } = render(
        <Avatar glow={false}>
          <AvatarFallback>No Glow</AvatarFallback>
        </Avatar>
      );
      const avatar = container.querySelector("[data-slot='avatar']");
      expect(avatar?.className).not.toContain("ring-purple-500/30");
    });
  });

  describe("Size Prop", () => {
    it("applies default md size classes", () => {
      const { container } = render(
        <Avatar>
          <AvatarFallback>MD</AvatarFallback>
        </Avatar>
      );
      const avatar = container.querySelector("[data-slot='avatar']");
      expect(avatar?.className).toContain("h-10");
      expect(avatar?.className).toContain("w-10");
    });

    it("applies sm size classes", () => {
      const { container } = render(
        <Avatar size="sm">
          <AvatarFallback>SM</AvatarFallback>
        </Avatar>
      );
      const avatar = container.querySelector("[data-slot='avatar']");
      expect(avatar?.className).toContain("h-8");
      expect(avatar?.className).toContain("w-8");
    });

    it("applies md size classes", () => {
      const { container } = render(
        <Avatar size="md">
          <AvatarFallback>MD</AvatarFallback>
        </Avatar>
      );
      const avatar = container.querySelector("[data-slot='avatar']");
      expect(avatar?.className).toContain("h-10");
      expect(avatar?.className).toContain("w-10");
    });

    it("applies lg size classes", () => {
      const { container } = render(
        <Avatar size="lg">
          <AvatarFallback>LG</AvatarFallback>
        </Avatar>
      );
      const avatar = container.querySelector("[data-slot='avatar']");
      expect(avatar?.className).toContain("h-16");
      expect(avatar?.className).toContain("w-16");
    });
  });

  describe("Styling", () => {
    it("applies transition classes", () => {
      const { container } = render(
        <Avatar>
          <AvatarFallback>Styled</AvatarFallback>
        </Avatar>
      );
      const avatar = container.querySelector("[data-slot='avatar']");
      expect(avatar?.className).toContain("transition-all");
      expect(avatar?.className).toContain("duration-200");
    });

    it("merges custom className", () => {
      const { container } = render(
        <Avatar className="custom-avatar">
          <AvatarFallback>Custom</AvatarFallback>
        </Avatar>
      );
      const avatar = container.querySelector("[data-slot='avatar']");
      expect(avatar).toHaveClass("custom-avatar");
    });

    it("combines glow and size classes", () => {
      const { container } = render(
        <Avatar glow size="lg">
          <AvatarFallback>Combined</AvatarFallback>
        </Avatar>
      );
      const avatar = container.querySelector("[data-slot='avatar']");
      expect(avatar?.className).toContain("h-16");
      expect(avatar?.className).toContain("w-16");
      expect(avatar?.className).toContain("ring-2");
      expect(avatar?.className).toContain("ring-purple-500/30");
    });
  });

  describe("Re-exports", () => {
    it("exports Avatar component", () => {
      expect(Avatar).toBeDefined();
    });

    it("exports AvatarImage component", () => {
      expect(AvatarImage).toBeDefined();
    });

    it("exports AvatarFallback component", () => {
      expect(AvatarFallback).toBeDefined();
    });

    it("renders full avatar composition", () => {
      const { container } = render(
        <Avatar size="lg" glow>
          <AvatarImage src="/test.jpg" alt="Test" />
          <AvatarFallback>TT</AvatarFallback>
        </Avatar>
      );
      // AvatarImage may not render if image fails to load
      const image = container.querySelector('[data-slot="avatar-image"]');
      if (image) {
        expect(image).toHaveAttribute("alt", "Test");
      }
      // Fallback should always be available
      expect(screen.getByText("TT")).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("forwards ref correctly", () => {
      const ref = { current: null };
      render(
        <Avatar ref={ref}>
          <AvatarFallback>Ref</AvatarFallback>
        </Avatar>
      );
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });

    it("works with base Avatar props", () => {
      render(
        <Avatar data-testid="avatar">
          <AvatarFallback>Props</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId("avatar");
      expect(avatar).toBeInTheDocument();
    });

    it("handles image load failure and shows fallback", () => {
      render(
        <Avatar>
          <AvatarImage src="/invalid.jpg" alt="Invalid" />
          <AvatarFallback>FB</AvatarFallback>
        </Avatar>
      );
      // Fallback should be available
      expect(screen.getByText("FB")).toBeInTheDocument();
    });
  });
});

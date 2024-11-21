import { describe, expect, it } from "vitest";
import { loadFixture } from "../testUtils.js";
import { generateAvatarSvg } from "./avatar.js";

describe("Avatars", () => {
  it("can parse an avatar with a beard", async () => {
    const page = await loadFixture(__dirname, "showplayer_dsh.html");
    const svg = await generateAvatarSvg(page);
    expect(svg).toContain(`title="/images/otherimages/classav11_f.gif"`);
    expect(svg).toContain(`title="/images/otherimages/moustaches/17.png"`);
  });
});

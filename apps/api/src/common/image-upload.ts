import { BadRequestException } from '@nestjs/common';

// extension -> canonical Content-Type, single source of truth for both the
// upload validators below and the serve-side Content-Type lookup (by
// extension) in MemberPhotosController / LogosController.
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

// file.mimetype is client-supplied and trivially spoofed (e.g. an uploaded
// .svg/.html renamed with mimetype: 'image/png'), so trust the actual file
// bytes instead — this is what stops a disguised script payload from ever
// reaching object storage as a "photo".
const MAGIC_BYTE_SNIFFERS: Array<{ extension: string; check: (buf: Buffer) => boolean }> = [
  { extension: '.jpg', check: (b) => b.length > 2 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    extension: '.png',
    check: (b) => b.length > 3 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  { extension: '.gif', check: (b) => b.length > 2 && b.toString('ascii', 0, 3) === 'GIF' },
  {
    extension: '.webp',
    check: (b) =>
      b.length > 11 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  },
];

// Validates an uploaded file is actually an image (by content, not by the
// client-supplied filename/mimetype) and returns the canonical extension +
// Content-Type to store it under. Throws if the bytes don't match a known
// image format.
export function validateImageUpload(file: { buffer: Buffer }): {
  extension: string;
  contentType: string;
} {
  const match = MAGIC_BYTE_SNIFFERS.find((sniffer) => sniffer.check(file.buffer));
  if (!match) {
    throw new BadRequestException('Only JPEG, PNG, WEBP, or GIF images are allowed.');
  }
  return { extension: match.extension, contentType: ALLOWED_IMAGE_TYPES[match.extension] };
}

// Serve-side counterpart: looks up the Content-Type to respond with purely
// from the (server-generated) stored filename's extension — never trusts
// stored/request-supplied metadata — so a browser is never left to
// MIME-sniff the response and potentially execute a payload.
export function contentTypeForStoredFilename(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  return ALLOWED_IMAGE_TYPES[ext] ?? 'application/octet-stream';
}

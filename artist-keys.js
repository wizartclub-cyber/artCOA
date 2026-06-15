/* ArtCOA — trusted registry of APPROVED signer public keys (artists & galleries).
 * Key = signer id (artist initials / gallery code, the same code used in the Edition ID).
 * Loaded by index.html (self-check) and verify.html (verification).
 *
 * Manage this list in admin-keys.html → "Download artist-keys.js" → commit/deploy this file.
 * Only what is committed here is trusted; nothing is trusted from the QR link itself.
 */
window.ARTIST_KEYS = {
  // "sd": "<Svitlana Dudenko's public key>",
  "sd": "eyJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6IldHWlhZeHZMRGNWMGJxVWJJUjRKNmVMamxRc0ZSUWxkZTNaejFxVm9XUlUiLCJ5IjoibTNvb1FtMXM2c3phWHB0ZEFrYVNUYUhCaUZyQWlZbWRRZnY4NnBsY2pLayJ9"
};

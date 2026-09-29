# Public school updates

In **Admin > Announcements**, create or edit a post and enable **Show on homepage
as a school update**. The **Published** switch must also be on. Save the post, then
use its Media section to upload photos, videos or other attachments. The first
photo or video becomes the card thumbnail. Photos open in a viewer; video
thumbnails open a player with controls, inline mobile playback and seeking.

Existing posts remain portal-only by default. Only ADMIN and SUPER_ADMIN users
can enable public visibility. Teachers cannot modify an already-public post,
including its attachments, even if they originally authored it. An administrator
must remove public visibility before the author can edit it again.

Guests see public, published and unexpired posts under **School updates** on the
homepage. Disable public visibility or publication to remove a post. The public
API selects only title, content, category, publication time and attachments; it
does not return authors' accounts, target audiences, comments or reactions.

Media links returned by the public feed check current publication eligibility
before serving a file. The frontend streams media and forwards byte ranges for
video seeking. Announcement uploads are stored as binary data in PostgreSQL, alongside their
metadata, so they survive web-service restarts and deployments. Upload size limits
still apply; these files count toward database storage usage. Media is excluded
from announcement JSON responses. The `/uploads/announcements` frontend route
forwards the signed-in session to an authorized backend media endpoint.
Other upload categories continue to use the existing static upload service.

Deploy the Prisma schema before the updated backend. Render's existing startup
command applies it with `prisma db push`; the new `isPublic` field defaults to
false. The nullable `data` and `mimeType` attachment columns store new uploads.
Surviving old announcement files are copied into the database when opened. Files
that were already lost must be uploaded again; metadata alone cannot restore them.
Other upload categories retain their existing storage limitations.

Run `npm run test:public-updates` in `backend` for isolated HTTP checks covering
guest access, admin-only publication, safe field selection, visibility filters,
pagination and public media authorization. No school database is used by the test.

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
video seeking. The `/uploads` frontend route also fixes existing relative media
URLs in the portal; it proxies the backend's existing static upload service.
This feature does not change the storage or access policy of that static service.

Deploy the Prisma schema before the updated backend. Render's existing startup
command applies it with `prisma db push`; the new `isPublic` field defaults to
false. Existing Render free-tier upload persistence limitations still apply.

Run `npm run test:public-updates` in `backend` for isolated HTTP checks covering
guest access, admin-only publication, safe field selection, visibility filters,
pagination and public media authorization. No school database is used by the test.

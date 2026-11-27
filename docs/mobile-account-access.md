# Mobile and web account access

Reviewed against the local mobile application on 27 November 2026.

| Feature                                                                         | Normal account                                        | Talent account                                                              |
| ------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------- |
| Home, Explore, category feeds and search                                        | Available                                             | Available                                                                   |
| Create and edit shared links                                                    | Available                                             | Available                                                                   |
| Like, comment, reply and rate content                                           | Available, subject to content privacy                 | Available, subject to content privacy                                       |
| Follow and rate talent profiles                                                 | Available, subject to profile privacy                 | Available, subject to profile privacy                                       |
| Receive profile follows and ratings                                             | Unavailable                                           | Available                                                                   |
| Saved collections                                                               | Available                                             | Available                                                                   |
| Direct chat and message requests                                                | Available                                             | Available                                                                   |
| Create and edit talent posts; Best Work pinning                                 | Unavailable                                           | Available                                                                   |
| Collaboration lists, creation, applications, invitations and scheduling         | Unavailable                                           | Available, subject to ownership and membership                              |
| Collaboration group chat                                                        | Unavailable                                           | Available, subject to membership                                            |
| Personal profile editing, settings, support, notifications and account deletion | Available                                             | Available                                                                   |
| Featured photos, social links and professional profile management               | Unavailable until upgraded                            | Available                                                                   |
| Profile visibility settings                                                     | Unavailable                                           | Available                                                                   |
| Own profile tabs                                                                | Overview and Shared Links                             | Also All Posts, Credits and Skills; education and awards appear in Overview |
| View other profiles                                                             | Available, subject to target privacy and profile type | Same                                                                        |
| Become a Talent                                                                 | Available from own profile and access notices         | Already a talent                                                            |

## Mobile references

- `app/screens/auth/RegisterSuccessfullyScreen.tsx`: normal/talent feature lists.
- `app/navigation/HomeNavigator.tsx`: shared links available to both types; creating posts and collaboration require talent status.
- `app/screens/chat/ChatDashboard.tsx`: group tab limited to talents; direct chat and requests remain available.
- `app/screens/user/UserProfile.tsx` and `PublicProfile.tsx`: tabs depend on the profile owner's account type, not the visitor's account type. Public Shared Links also follow the API's `canShare` permission.
- `app/screens/user/components/ProfileInfo.tsx`: normal owners can become talents.
- `app/screens/user/components/PublicProfileInfo.tsx` and `FollowerCard.tsx`: follow/rating controls apply to talent targets; direct messaging remains available for normal targets.
- `app/screens/user/EditProfile.tsx`: professional information, featured photos and social fields limited to talents.
- `app/screens/settings/Settings.tsx`: visibility settings limited to talents.

## Web enforcement

Authenticated API responses determine account type. Browser storage, submitted user IDs, submitted role flags and chat URL hints do not grant talent access. Missing or malformed account verification does not grant access.

The web checks account type in talent-only route entry points and server actions, including the collaboration action helper, post publishing/editing and Best Work actions, professional profile mutations, profile feed actions, privacy mutations, and group chat actions and HTTP listing. Normal accounts retain shared-link editing, direct messaging and the ability to follow/rate talents. Chat room classification uses server-provided room information rather than the URL's `type` parameter.

Normal accounts can edit and clear ethnicity, as in mobile. Only ethnicity is permitted in a normal account's `moreInfo` update; professional bio, featured photos and social links remain restricted. The existing public-profile visibility checks continue to apply. No backend, mobile, OneSignal dashboard or deployment configuration is changed by this work.

## Verification

Checks completed: **580 automated tests passed**, TypeScript validation passed, ESLint passed without warnings, and the production build passed.

Automated coverage exercises normal and talent accounts, malformed role values, forged content types and sender identities, direct routes, collaboration operations, group-room access, professional profile mutations, privacy changes, and preservation of shared links/direct messages. Existing regression tests cover browsing, comments, ratings, collections, profile editing and registration.

Live verification with a normal account and a talent account remains necessary before client handover. This change does not claim that backend socket authorization or a production deployment has been tested.

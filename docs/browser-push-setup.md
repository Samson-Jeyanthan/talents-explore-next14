# Browser push activation

Status: integration prepared; delivery is unverified and disabled until OneSignal Web configuration is completed. The existing notification inbox, account notification preferences and quiet mode continue to work.

1. In the OneSignal app used by the backend/mobile app, open **Settings → Push & In-App → Web**. The mobile app's public App ID is `ac834d04-3762-4a92-838d-321104b1e6c5`. Confirm this is the same app that the backend sends to before using it.
2. Choose **Custom Code**, set the exact production origin to `https://talentsexplore.com`, and complete Web setup. Keep automatic prompts disabled. The app asks for permission only when the user presses **Enable on this browser** in Settings → Notifications.
3. Add these public build variables to the deployment environment, using the confirmed App ID:

   ```env
   NEXT_PUBLIC_ONESIGNAL_APP_ID=your-confirmed-public-app-id
   NEXT_PUBLIC_ONESIGNAL_SITE_ORIGIN=https://talentsexplore.com
   ```

   Rebuild and deploy. These variables are embedded at build time. Do not put REST API keys or private keys in public variables. Leave both variables unset until dashboard setup is complete.

4. Confirm `/OneSignalSDKWorker.js` is publicly accessible over HTTPS with JavaScript content and no authentication or redirect. The repository includes the v16 worker at that path. The site must not have another service worker controlling the same scope.
5. Sign in with an approved test account, enable the account push preference and then enable **This browser**. In OneSignal, verify the browser subscription is subscribed and its External ID matches the backend account `_id`, as in mobile. The backend must target that External ID in this same OneSignal app. Use a dedicated test account for delivery testing.
6. Verify foreground/background delivery and notification click URLs; notification launches are controlled by the backend's Web URL payload. Configure a web URL on messages/templates (for example `/home` on this origin), rather than a mobile deep link. Detailed click destinations remain subject to a real payload test.
7. Verify blocked permission, browser opt-out, sign-out, account switching, reload and offline recovery. On iOS/iPadOS 16.4+, web push requires opening the site as an installed Home Screen web app; this change does not add an install manifest or claim iOS web push readiness.

For local testing, use a separate OneSignal app configured for the exact localhost origin and enable its localhost testing option. Set the two build variables for that app/origin and restart Next.js. Do not point a production Web app at localhost. Unconfigured or mismatched origins never load the SDK.

The browser control changes only this browser subscription. The existing account notification preference and quiet mode remain backend settings. Signing out opts out and unlinks this browser, and a later user must explicitly enable it again. A cleanup marker (no account ID or token) is retained if cleanup fails so a subsequent page load can retry. Offline sign-out cannot prove remote removal until the device reconnects.

Identity is verified with a server action before association; cached profile data is not used as the recipient. If OneSignal Token Identity Verification is enabled, a backend-generated OneSignal JWT and SDK login integration are additionally required before activation. This implementation does not generate those tokens.

References: [Web setup](https://documentation.onesignal.com/docs/en/web-sdk-setup), [SDK reference](https://documentation.onesignal.com/docs/en/web-sdk-reference), [Service worker](https://documentation.onesignal.com/docs/en/onesignal-service-worker).

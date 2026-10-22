# No Vacancy

A neon-noir pixel-art open world for the browser. You inherit Uncle Ray's rundown motel on Sunset Boulevard, along with his debt to a loan shark. Rent rooms, clean and repair them, and work the black market under the old metro. Dodge the cops and take down a crooked captain. Then grow the Starlite into a sixteen-storey luxury tower.

It's a plain static site (HTML, CSS and JS) with no build step and no server code. It's built for landscape play on phones, and it also works with a mouse and keyboard.

## Put it on Vercel

1. Unzip `novacancy.zip`. You get a folder called `novacancy` with `index.html` inside.
2. Go to **github.com** and click **+** (top right), then **New repository**. Name it `novacancy`, keep it **Public**, and click **Create repository**.
3. On the new repo page, click **uploading an existing file**. Drag in **everything inside** the `novacancy` folder (`index.html`, `css`, `js`, `icons`, `manifest.json`, `sw.js`, `vercel.json`), then click **Commit changes**.
4. Go to **vercel.com**, click **Add New**, then **Project**. Find `novacancy` and click **Import**.
5. Leave every setting as it is and click **Deploy**. About 20 seconds later you get a link like `novacancy.vercel.app`.

To update the game later, upload the changed files to the same repo. Vercel redeploys on its own.

## Fullscreen on a phone

Open the link in Safari or Chrome, tap **Share** (or the browser menu), then **Add to Home Screen**. Launch the game from the new icon and turn your phone sideways. It runs fullscreen, with no address bar.

## Accounts

On the live site you sign in with a username and password before playing. Your progress is saved to your account online, so you can sign in on any phone or computer and keep going. Accounts and saves are stored in the project's Upstash Redis database (Vercel → Storage). The server code is in `api/`.

## Saving

The game saves on its own every few seconds, after everything you do, and the moment you leave the app. Open it again and tap **Continue**.

Safari and the home-screen app keep **separate** saves on iPhone. To move a game between them, or to a new phone, open **Phone → Settings → Copy save code**, then on the other one tap **Load a save code** and paste it.

Saves live on the phone itself, so deleting the home-screen app or clearing Safari's website data also deletes the save. Copy a save code first if you're about to do that.

## Settings worth knowing

Phone → Settings → **Night** switches between Dark, Normal and Bright nights if it's hard to see after dark.

## Things to do between guests

- **Gigs** (Phone → Gigs): courier jobs around Lowtown. Pick up a parcel, follow the orange arrow, beat the clock. Fast deliveries tip 30%. Late-night jobs are shady and pay more, but the parcel counts as hot cargo.
- **Street buyers**: strangers with a **$** over their head want something. Tap them to sell from your bag.
- **Tour bus**: most days a bus drops off a few guests at once in the afternoon or evening.
- **Wait for guests**: ring the bell at the front desk to skip ahead until the next guest walks in.

## Controls

- **Tap** to walk, and tap things or people to use or talk to them.
- **Drag** anywhere to steer. Drag far to run.
- **Pinch** to zoom.
- **Keyboard**: WASD or arrow keys to move, Shift to run, E or Space to use, P for the phone, Esc for the menu.

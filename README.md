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

## One city

Downtown (north) and Lowtown (south) are one continuous map now: walk or drive straight down Grand Ave into Sunset Blvd, no loading. Buses, cabs and the Red Line still get you across town fast. Both big junctions have working traffic lights; cars stop at red lights, for each other, and for people, and you can't walk through them. Every interior has a lit EXIT door. The phone Map shows the whole city: drag to pan, pinch or +/- to zoom, Me to follow yourself, City for the full view.

## Bel Vista, Palm Shore and the airport

South of Lowtown, Sunset Blvd keeps going:
- **Bel Vista**: the rich hills. The pink Bel Vista Hotel (lobby, Polo Bar), the designer shops of Regent Row, hillside villas with pools, and the big white letters on the hill.
- **Palm Shore**: the beach. Boardwalk, surf shack (rent a board and catch a wave), ice cream, lifeguard towers, a towel in the sun to cool your heat, and a pier with a Ferris wheel you can ride.
- **Harbor International**: the airport. Watch jets take off and land; inside the terminal, take a charter flight over the whole city or a weekend in Las Vistas.
The Lowtown bus stop runs to the beach and the airport; cabs from the airport go back to the Starlite or downtown.

## Downtown

Walk north up Sunset Blvd, ride the bus from the stop by the motel ($2), or take a cab ($12). Downtown has:

- **Aurora Tower**: the concierge has three residences: the Sky Loft (floor 30), the Corner Suite (floor 34) and The Crown (the whole top floor, with a terrace and infinity pool). Tour any of them, rent by the week (charged every 7 days, from cash then bank; two missed payments and you're out) or buy outright. Floor-to-ceiling glass looks out on a living skyline: lit windows change through the night, traffic streams along the highway, helicopters, planes and a blimp drift past, and roof beacons blink.
- **Habitat** (phone app): order furniture: 30+ modern pieces (sofas, a king bed, home theater, gaming setup, reef aquarium, grand piano, fireplace, hot tub, art and more). Free delivery the next morning at 9 AM, or Express for +25% and it arrives right away. Then place it yourself: pick an item, tap the floor, rotate, place. Move or store anything later. Most pieces do something (sleep, relax, watch, play, study, run, soak).
- **First Harbor Bank**: deposit cash (1% interest a night, safe from cops and raids). ATMs on the street.
- **Lucky 7 Casino**: blackjack and slots.
- **Daily Grind** (coffee), **Silk & Steel** (outfits), **Central Park** (chess with Old Man Ito, hot dogs, a busker, the fountain).
- The Red Line from Grand Station back to Sunset Station in Lowtown.

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

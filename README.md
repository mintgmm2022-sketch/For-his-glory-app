# For His Glory · ለክብሩ — the app

The installable app for **For His Glory**: Amharic worship songs by Mintesinot Gebremichael, Daily Bread, and a shared Prayer Wall.

- **Today** — the newest Daily Bread, the song of the day, a reading streak and new-verse alerts
- **Songs** — every song plays inside the app with a spinning record and the full lyrics to pray along
- **Daily Bread** — every verse, with Amen and Share
- **Together** — a live Prayer Wall (with “I prayed”) and comments, shared by everyone
- **Owner** — sign in to post Daily Bread, add or edit songs and lyrics, and hide or delete posts

It works offline for lyrics and saved verses, and installs on iPhone and Android from the browser.

---

## Setup (about 15 minutes, all from a phone)

### 1. Turn the app on at a web address (GitHub Pages)
1. In this repository, open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
3. After a minute the address appears at the top, for example
   `https://app.mintesinot.org/`.

The app already works at this point with all songs, lyrics and Daily Bread built in. Prayers and comments stay on each phone until step 3 is done.

### 2. Create the database (Supabase, free)
1. Go to **supabase.com** → **Start your project** → sign in with GitHub.
2. **New project**: name it `for-his-glory`, choose a strong database password (save it somewhere), pick the region closest to your listeners, then **Create**.
3. When it’s ready, open **SQL Editor → New query**, paste everything from [`supabase/schema.sql`](supabase/schema.sql), and tap **Run**.
4. Open a **New query** again, paste everything from [`supabase/seed.sql`](supabase/seed.sql), and tap **Run**. This adds your songs, lyrics, Daily Bread and comments.

### 3. Connect the app to the database
1. In Supabase open **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. In this repository open [`js/config.js`](js/config.js), tap the pencil to edit, paste them between the quotes, and **Commit changes**.

(The anon key is meant to be public. The database’s security rules decide what visitors can do.)

### 4. Create your owner login
In Supabase open **Authentication → Users → Add user → Create new user**, enter your email and a password, and tick **Auto confirm user**.

### 5. Mark that login as the owner
In **SQL Editor**, run (with your email):

```sql
insert into public.owners (user_id)
select id from auth.users where email = 'you@example.com';
```

Now open the app → **Together** → **Owner** at the bottom, and sign in.

### 6. Use your own address (optional)
To use `app.mintesinot.org`: in **Settings → Pages → Custom domain** enter it, then at your domain provider add a **CNAME** record `app` → `mintgmm2022-sketch.github.io`.

---

## Installing the app
- **iPhone:** open the address in **Safari** → **Share** → **Add to Home Screen**.
- **Android:** open it in **Chrome** → **Install app** (or menu → **Add to Home screen**).

## What each part does
| File | Purpose |
| --- | --- |
| `index.html`, `css/app.css` | The screens and design |
| `js/app.js` | Playback, Prayer Wall, comments, owner tools, live updates |
| `js/data.js` | Built-in songs, lyrics, Daily Bread and comments (used offline and before setup) |
| `js/config.js` | The database connection |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline support and installing |
| `supabase/schema.sql` | Database tables and security rules |
| `supabase/seed.sql` | Starting content |

## Notes
- Songs play through YouTube. The video shows in the player while it plays, so playback pauses when the player is closed.
- New-verse alerts arrive while the app is open or running in the background. Alerts when the phone is fully closed need a push server, which can be added later.

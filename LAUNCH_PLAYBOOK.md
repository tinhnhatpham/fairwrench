# FairWrench — $0-Capital Launch & Profit Playbook

FairWrench is built to launch and run at **$0/month fixed cost** while compounding two automated traffic engines:
1. **200 Programmatic SEO Cost Guides** (`/costs/...` + `/sitemap.xml`) capturing high-intent Google searchers asking *"how much should [car] [repair] cost?"*
2. **Short-Form Organic Video Hooks + Reddit Car Communities** funneling drivers directly into your **$4.99 Single Audit** / **$9.99/mo Pro** checkout.

---

## Step 1: Deploy Live for $0 (10 Minutes)

1. **Get a Free Gemini API Key (for Quote Photo OCR):**
   - Go to [Google AI Studio](https://aistudio.google.com/apikey) and create a free API key.
   - *(Note: Even without an API key, FairWrench already runs live NHTSA recall lookups + grounded local benchmark audits on pasted text quotes!)*

2. **Create a $0/Month Checkout Account on Polar.sh (Recommended) or Stripe:**
   - Sign up at [polar.sh](https://polar.sh) (Starter plan = **$0/month**, acts as Merchant of Record so Polar handles global sales tax & VAT automatically).
   - Create two products:
     - **Product 1:** `FairWrench Single Quote Audit` — **$4.99 one-time**
     - **Product 2:** `FairWrench Driver Shield Unlimited` — **$9.99/month**
   - Set the **Success Redirect URL** for both products to:
     `https://YOUR-VERCEL-DOMAIN.vercel.app/?unlocked=1#auditor`
   - Copy both Checkout Link URLs.

3. **Deploy Free on Vercel:**
   - Push the `fairwrench` folder to a free GitHub repository.
   - Import the repo at [vercel.com](https://vercel.com) (Hobby tier = **$0/month**).
   - Add these Environment Variables in Vercel Project Settings:
     - `GEMINI_API_KEY` = your Google AI Studio key
     - `POLAR_CHECKOUT_URL_SINGLE` = your $4.99 Polar checkout link
     - `POLAR_CHECKOUT_URL_PRO` = your $9.99/mo Polar checkout link
     - `NEXT_PUBLIC_SITE_URL` = `https://YOUR-VERCEL-DOMAIN.vercel.app`
   - Click **Deploy**. You are live and accepting real money for $0 spent.

4. **Turn On Automated Organic Google Traffic (5 Minutes):**
   - Open [Google Search Console](https://search.google.com/search-console).
   - Verify your Vercel URL and submit: `https://YOUR-VERCEL-DOMAIN.vercel.app/sitemap.xml`
   - Google will begin indexing all **200 Vehicle × Repair Cost Guides** automatically.

---

## Step 2: $0 Daily Traffic Routine (First $1,000/Month)

Do **not** spend money on paid ads until organic traffic proves your conversion rate.

### A. 1 Short-Form Video / Day (TikTok + Instagram Reels + YouTube Shorts)
Find a real outrageous repair estimate posted publicly on `r/MechanicAdvice` or `r/AskMechanics` (always blur/hide shop names and customer info). Paste the line items into FairWrench, click **Audit**, unlock, and screen-record your phone for 20 seconds using these proven hooks:

1. **The Dealership Padding Hook:**
   > *"The dealership just handed a 2020 Honda Accord owner a $1,845 quote. Watch what turned bright red when I ran it through this quote auditor: $98 for a $15 cabin filter, $289 for a fuel flush Honda doesn't even require, and $845 for front brakes that should be $450. Link in bio before you sign a shop invoice."*
2. **The Free Recall Shock Hook:**
   > *"Never pay a mechanic until you run your VIN against live NHTSA recalls. This 2020 Accord had 5 safety recalls on file—dealers are legally required to fix open recalls for $0."*
3. **The Waiting Room Script Hook:**
   > *"Standing in a repair shop waiting room feeling pressured? Don't say 'that's too expensive.' Read this exact sentence to the service advisor: 'Could you show me the book labor hours and separate what is strictly unsafe to drive today from what can wait 60 days?'"*
4. **The "Fair Quote" Trust Builder:**
   > *"People think every mechanic is a scam—let's check this $540 Toyota Camry quote from an independent shop. Score: 92/100, Fair Price. This is what an honest shop looks like."*
5. **The Used-Car Lot Hook:**
   > *"Before buying a used car, type the 17-digit VIN from the windshield into this free recall + complaint scanner. It pulls every NHTSA owner complaint hotspot in 3 seconds."*

### B. Helpful Replies in Car Communities (Zero Spam)
Browse `r/MechanicAdvice`, `r/AskMechanics`, `r/whatcarshouldibuy`, and Facebook car owner groups. Whenever someone posts *"Am I getting ripped off on this $1,400 quote?"*:
- Run their quote through FairWrench, give them a **genuinely helpful, free breakdown right in the comment** (fair range + which upsells to decline + any NHTSA recalls), and only mention FairWrench if asked or in your profile bio.

---

## Step 3: Revenue Math (Zero Fixed Overhead)

| Daily Paid Unlocks ($4.99 avg) | Monthly Gross Revenue | Hosting + NHTSA API Cost |
|---|---|---|
| 5 / day | ~$750 / mo | $0 |
| 15 / day | ~$2,245 / mo | $0 |
| 40 / day | ~$5,988 / mo | ~$20/mo (Vercel Pro + Gemini usage) |

Once you cross **$1,000/month** in organic revenue, buy a $10 `.com` domain and reinvest 20% of profits into boosting whichever organic TikTok/Reel had the highest link clicks.

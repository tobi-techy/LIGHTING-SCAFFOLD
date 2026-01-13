# Demo Deployment

To deploy the live demo:

1. **Generate a demo project:**
   ```bash
   npx create-lightning-scaffold demo
   # Choose: Web App → Next.js → tailwind → zustand → npm
   ```

2. **Copy to demo folder in this repo:**
   ```bash
   cp -r demo /path/to/create-lightning-scaffold/demo
   ```

3. **Deploy to Vercel:**
   - Push changes to GitHub
   - Go to https://vercel.com/new
   - Import the `demo` folder
   - Deploy

4. **Update README with live URL**

Or use Vercel CLI:
```bash
cd demo
npm install -g vercel
vercel --prod
```

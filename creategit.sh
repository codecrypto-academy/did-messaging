gh repo delete codecrypto-academy/did-messaging
gh repo create codecrypto-academy/did-messaging --public 
rm -rf .git
git init 
git remote add origin https://github.com/codecrypto-academy/did-messaging  
git add . && git commit -m "Initial commit" 
git push -u origin main
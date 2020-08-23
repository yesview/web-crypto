# web-crypto
Just trying out web crypto module

1) You can go to [github pages](https://david3352565.github.io/web-crypto/). This site will generate non-extractable public and private RSA keys and print out the public key. 
2) Then you can go to [playground](https://play.golang.org/p/kYlt1GMEKCA) and add your public key in `key` variable (instead of `<PUT YOU KEY HERE>` string).
3) Then you can add your secret to `secret` variable (insdead of `<PUT YOU SECRET STRING HERE>` string) to specify secret you want to encrypt and click `Run`. As a result you will get string containing encrypted and base64 encoded secret.
4) You copy that encrypted secret, put it into form on page (after `Put you encrypted data here` note) and click `Decrypt` button

Ideally your secret should appear on the page.

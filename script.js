const str2ab = str => {
    const buf = new ArrayBuffer(str.length); // 2 bytes for each char
    const bufView = new Uint8Array(buf);
    for (let i = 0; i < str.length; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
};

const ab2str = buf => {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
};

const encodeBuffer = buf => {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
};

const generateKey = async (module) => {
    return await module.generateKey(
        {name: 'RSA-OAEP', modulusLength: 2048, hash: 'SHA-256', publicExponent: new Uint8Array([0x01, 0x00, 0x01])},
        false,
        ['encrypt', 'decrypt']
    );
};

const getPublicKey = async (module, key) => {
    if (key.extractable) {
        console.log(key);
        const exportedKey = await module.exportKey(
          'spki',
          key,
        );
        return encodeBuffer(exportedKey)
    }
};

const decrypt = async (secret, key) => {
    const cryptoModule = crypto.subtle;
    let decryptedSecret;
    try {
        decryptedSecret = await cryptoModule.decrypt(
            {name: 'RSA-OAEP'},
            key.privateKey,
            str2ab(atob(secret))
        );
    } catch (e) {
        console.error(e)
    }

    return decryptedSecret
};

const encryptString = async (key) => {
    const cryptoModule = crypto.subtle;

    const secret = 'whoopsie im a secret';
    const encryptedSecret = await cryptoModule.encrypt(
        {name: 'RSA-OAEP'},
        key.publicKey,
        str2ab(secret)
    );

    return encodeBuffer(encryptedSecret);
};

const openConnectionToDB = () => {
    return new Promise((res, rej) => {
        const DBOpenRequest = window.indexedDB.open('keys', 4);
        DBOpenRequest.onsuccess = function(e) {
            const db = DBOpenRequest.result;
            res(db)
        };

        DBOpenRequest.onupgradeneeded = e => {
            const db = e.target.result;
            console.log('upgrade needed',db);
            const objectStore = db.createObjectStore("keys", { keyPath: 'key' });
            objectStore.createIndex("RSAKeysIndex", "keyIdx");
        }
    });
};

const saveData = (db, data) => {
    return new Promise((res, rej) => {
        const transaction = db.transaction(['keys'], 'readwrite');
        transaction.oncomplete = function(event) {
            console.log("Transaction completed")
        };
        transaction.onerror = function(event) {
            console.log('Transaction not opened due to error. Duplicate items not allowed')
        };


        const store = transaction.objectStore('keys');
        console.log('store', store);

        const objectStoreRequest = store.put({key: "firstKey", keyIdx: 'firstKey', data: data});
        objectStoreRequest.onsuccess = function(event) {
            console.log('Request successful');
            res()
        }
    })
};

const getData = (db) => {
    return new Promise((res, rej) => {
        const transaction = db.transaction(['keys'], 'readonly');

        const store = transaction.objectStore('keys');
        console.log('store', store);

        const index = store.index('RSAKeysIndex');
        const request = index.get("firstKey");

        const allRequest = index.getAll();
        allRequest.onsuccess = () => {
            console.log("ALL DATA", allRequest)
        };
        request.onsuccess = () => {
            console.log(request);
            console.log('Successful, getKey result is', request.result);
            res(request.result)
        };
        request.onerror = () => {
            console.log('error')
        };
    })
};

const getKeys = async () => {
    const db = await openConnectionToDB();
    const cryptoModule = crypto.subtle;
    console.log(db);

    let data = await getData(db);
    if (data === undefined) {
        const key = await generateKey(cryptoModule);

        await saveData(db, {RSAKeys: key});
        console.log('data saved');

        data = await getData(db);
        console.log(data)
    }

    return data.data.RSAKeys
};

const main = async () => {
    const cryptoModule = crypto.subtle;
    const key = await getKeys();
    document.getElementById('public-key').textContent = await getPublicKey(cryptoModule, key.publicKey);
};

main();

window.onload = () => {
    document.getElementById('decrypt').addEventListener('click', async  e => {
        e.preventDefault();

        const secret = document.getElementById('encrypted-data').value;
        const key = await getKeys();

        document.getElementById('decrypted-data').innerText = ab2str(await decrypt(secret, key));
    });
};

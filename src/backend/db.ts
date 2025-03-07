import path from 'node:path';
import { app } from 'electron';
import fs from 'node:fs';
// import { SecureKeyStore } from './secure-storage';

export type book = {
    title: string;
    vectorDBCollectionMappping: string;
    indexingStatus?: 'pending' | 'indexing' | 'indexed' | 'failed';
}

export type dbSchema = {
    books: Array<book>,
    userSettings?: {
        apiKey: string;
    }
}


export class DB {
    books: Array<book>;
    store: any;
    dbPath = path.join(app.getPath('userData'), 'simple-json-db.json');
    // secureKeyStore: SecureKeyStore;
    constructor() {
        this.books = [];
        this.store = {};
        // this.secureKeyStore = new SecureKeyStore();
    }

    init() {
        if (!fs.existsSync(this.dbPath)) {
            fs.writeFileSync(this.dbPath, JSON.stringify({ books: [] }, null, 2));
        }
        this.store = JSON.parse(fs.readFileSync(this.dbPath, 'utf-8'));
        this.books = JSON.parse(fs.readFileSync(this.dbPath, 'utf-8')).books;
    }

    getBooks() {
        this.init()
        return this.books;
    }

    addBook(book: book) {
        let bookExists = this.books.find(b => b.title === book.title);
        if (bookExists) {
            console.log('Book already exists:', bookExists);
            return;
        }
        this.books.push(book);
        fs.writeFileSync(this.dbPath, JSON.stringify({ books: this.books }, null, 2));
        return { success: true, message: 'Book added successfully' };
    }

    updateBook(book: book) {
        let bookExists = this.books.find(b => b.title === book.title);
        if (!bookExists) {
            console.log('Book not found:', bookExists);
            return;
        }
        const index = this.books.indexOf(bookExists);
        this.books[index] = book;

        //fs.writeFileSync(this.dbPath, JSON.stringify({ books: this.books }, null, 2));
        let tempStore = JSON.parse(fs.readFileSync(this.dbPath, 'utf-8'));
        tempStore.books = this.books;
        fs.writeFileSync(this.dbPath, JSON.stringify(tempStore, null, 2));
        return { success: true, message: 'Book updated successfully' };
    }

    saveUserSettings(apiKey: string) {

        let userSettings = {
            apiKey: apiKey
        }
        let tempStore = JSON.parse(fs.readFileSync(this.dbPath, 'utf-8'));
        tempStore.userSettings = userSettings;
        fs.writeFileSync(this.dbPath, JSON.stringify(tempStore, null, 2));
        return { success: true, message: 'User settings saved successfully' };
    }

    getUserSettings() {
        let tempStore = JSON.parse(fs.readFileSync(this.dbPath, 'utf-8'));
        return tempStore.userSettings;
    }

    getAPIKey() {
        let tempStore = JSON.parse(fs.readFileSync(this.dbPath, 'utf-8'));
        return tempStore?.userSettings?.apiKey ?? "";
    }

}
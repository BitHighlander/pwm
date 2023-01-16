const Cryptr = require('cryptr')

export class Pwm {
    // declare our property types
    private cryptr: any;

    constructor(pw: string) {
        this.cryptr = new Cryptr(pw);
    }

    encrypt(payload: string) {
        return this.cryptr.encrypt(payload)
    }

    decrypt(payload: string) {
        return this.cryptr.decrypt(payload)
    }
}
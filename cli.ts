import { Pwm } from './pwm'
const path = require('path')
const Cryptr = require('cryptr')
const fs = require('fs-extra')
const homedir = require('os').homedir()
const mkdirp = require('mkdirp')
const vorpal = require('vorpal')();
const bcrypt = require('bcrypt');
const saltRounds = 10;

//Storage location
export const appDir = path.join(homedir, '.keepkey', 'pwm_data')

let isSetup = false
let isLocked = true
let pwm

const onStart = async function () {
    try {

        let isCreated = await mkdirp(appDir)
        //console.log('Created pw store: ', isCreated)
        let hashedPwExists = await fs.pathExists(appDir + '/pw_hash')

        if(hashedPwExists) {
            isSetup = true
            if(isLocked){
                console.log('Welcome back to Pass! type *login* to begin. ')
                //read pw hash
                let hashedPw = fs.readFileSync(appDir + '/pw_hash', 'utf8')
                //console.log('hashedPw: ', hashedPw)
                vorpal
                    .command('login')
                    .action(async function (params, cb) {
                        let resultPw = await this.prompt([{
                            type: 'password',
                            name: 'password',
                            message: 'password: '
                        }]);
                        bcrypt.compare(resultPw.password, hashedPw, function(err, result) {
                            // result == true
                            console.log('result: ', result)
                            if(result){
                                isLocked = false
                                console.log('login success!')
                                pwm = new Pwm(resultPw.password)
                                onStart()
                            }
                        });
                    });

            } else {
                //readDir
                let files = await fs.readdir(appDir)
                for(let i = 0; i < files.length; i++){
                    if(files[i] !== 'pw_hash')console.log("stored pw name: ",files[i])
                }
                console.log('*encrypt* to create a new. ')
                vorpal
                    .command('encrypt [name] [value]', 'save encrypted value')
                    .action(async function(args) {
                        // this.log('args: ', args)
                        const encryptedString = pwm.encrypt(args.value)
                        // this.log('encryptedString: ', encryptedString)
                        //write to disc
                        let success = fs.writeFileSync(appDir + '/' + args.name, encryptedString)
                        console.log('success: ', success)
                    });

                vorpal
                    .command('decrypt [name]', 'read encrypted value and decrypt')
                    .action(async function(args) {
                        // this.log('do decrypt: ',args);
                        if(await fs.pathExists(appDir + '/' + args.name)){
                            let encryptedString = await fs.readFile(appDir + '/' + args.name)
                            const decryptedString = pwm.decrypt(encryptedString)
                            console.log("decryptedString: ",decryptedString)
                        }else{
                            console.log("password doesn't exist")
                        }
                    });

                vorpal
                    .command('list', 'list all passwords')
                    .action(async function(args) {
                        let files = await fs.readdir(appDir)
                        for(let i = 0; i < files.length; i++){
                            if(files[i] !== 'pw_hash')console.log("Found: ",files[i])
                        }
                    });

            }



        } else {
            console.log('Welcome to Pass! type *create* to begin. ')
            vorpal
                .command('setup')
                .action(async function (params, cb) {
                    let result = await this.prompt([{
                        type: 'password',
                        name: 'password',
                        message: 'password: '
                    }]);
                    this.log('result: ',result);
                    bcrypt.hash(result.password, saltRounds, function(err, hash) {
                        if(err) console.error(err)
                        console.log('did hash: ',hash);
                        // Store hash in your password DB.
                        let resultSave = fs.writeFileSync(appDir + '/pw_hash', hash)
                        console.log('resultSave: ',resultSave);
                        onStart()
                    });
                });
        }

        vorpal
            .delimiter('pass: ')
            .show();



    } catch (e) {
        console.error('Failed to create pw store e: ',e)
    }
}
onStart()

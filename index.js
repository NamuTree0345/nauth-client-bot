const discord = require('discord.js')
const qs = require('qs')
const axios = require('axios').default
const config = require('./config.json')
const client = new discord.Client()
const fs = require('fs')
const inputingCodeMap = new Map()

client.on('ready', () => {
    console.log('ready')
})

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

function makeidnum(length) {
    var result           = '';
    var characters       = '0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

client.on('message', (msg) => {

    if(msg.channel.type === "dm") return
    if(msg.author.bot) return

    if(inputingCodeMap.get(msg.member.id)) {
        msg.delete()
        axios.post('https://nauth.namutree0345.xyz/token', qs.stringify({
            client_id: '274563',
            client_secret: 'g4P1jjab3WS3Dvabla8m6N3hGn5v2xSOVVFLkAopWm7q1ssSThbA4LF3ZTnt',
            code: msg.content
        }), {
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            }
        }).then((val) => {
            console.log('1')
            const token = val.data.token
            axios.get('https://nauth.namutree0345.xyz/authenticate?client_id=274563&client_secret=g4P1jjab3WS3Dvabla8m6N3hGn5v2xSOVVFLkAopWm7q1ssSThbA4LF3ZTnt', {
                headers: {
                    Authorization: 'Bearer ' + token
                }
            }).then((val2) => {
                const profile = val2.data.profile
                if(profile) {
                    const json = {
                        name: profile.name,
                        uuid: profile.id,
                        clients: []
                    }
                    fs.writeFile(`./data/${msg.member.id}.json`, JSON.stringify(json), (err) => {
                        if(err) return msg.channel.send(':x: 오류 발생! 개발자에게 문의해주세요!')
                        msg.channel.send(':white_check_mark: 계정 등록 완료!')
                    })
                    return
                }
                msg.channel.send(':x: 오류 발생! 개발자에게 문의해주세요!')
            }).catch((reas) => {
                console.log(reas.response)
                msg.channel.send(':x: 코드가 잘못되었습니다.')
            })
        }).catch(() => {
            msg.channel.send(':x: 코드가 잘못되었습니다.')
        })
        inputingCodeMap.delete(msg.member.id)
        return
    }

    if(msg.content.startsWith('!계정')) {
        if(fs.existsSync('./data/' + msg.member.id + '.json')) {
            fs.readFile(`./data/${msg.member.id}.json`, {encoding: 'utf-8'}, (err, data) => {
                if(err) return console.error(err)
                const json = JSON.parse(data)
                let embed = new discord.MessageEmbed()
                embed.setTitle(json.name + '님의 프로필')
                embed.setThumbnail(`https://crafatar.com/renders/body/${json.uuid}`)
                let clients = '```'
                for(let i = 0; i < json.clients.length; i++) {
                    clients += `${i + 1}. ${json.clients[i]}\n`
                }
                clients += '```'
                embed.addField('소유하고계신 클라이언트', clients)
                msg.channel.send(embed)
            })
        } else {
            msg.channel.send(':x: !연동 명령어로 마인크래프트 계정과 연동해주세요!')
        }
    } else if(msg.content.startsWith('!연동')) {
        if(fs.existsSync('./data/' + msg.member.id + '.json')) {
            msg.channel.send(':x: 이미 계정이 연동돼있습니다!')
        } else {
            const embed = new discord.MessageEmbed()
            embed.setTitle('마인크래프트 연동')
            embed.setColor(0x00FF00)
            embed.setDescription('[이 링크](https://nauth.namutree0345.xyz/?client_id=274563)를 열어 로그인하고 채팅에 코드를 입력해주세요!')
            inputingCodeMap.set(msg.member.id, msg.channel.id)
            msg.channel.send(embed)
        }
    } else if(msg.content.startsWith('!등록')) {
        let args = msg.content.split(' ')
        if(args.length >= 1) {
            let argMerge = ''
            for (let i = 0; i < args.length; i++) {
                if(i !== 0) {
                    const element = args[i]
                    if(i === args.length - 1) {
                        argMerge += element
                    } else {
                        argMerge += element + ' '
                    }
                }
            }
            fs.readFile(`./data/${msg.member.id}.json`, {encoding: 'utf-8'}, (err, data) => {
                if(err) return console.error(err)
                fs.readFile(config.clientsDir, {encoding: 'utf-8'}, (err2, data2) => {
                    if(err2) return console.error(err2)
                    
                    const c = JSON.parse(data2)
                    const c2 = JSON.parse(data)
                    if(!c.find(elem => elem.name == argMerge)) {
                        if(c2.clients.length + 1 < 3) {
                            c2.clients.push(argMerge)
                            const csecret = makeid(60)
                            const cid = makeidnum(6)
                            c.push({
                                id: cid,
                                secret: csecret,
                                name: argMerge
                            })

                            fs.writeFile(`./data/${msg.member.id}.json`, JSON.stringify(c2), (err) => {})
                            fs.writeFile(config.clientsDir, JSON.stringify(c), (err) => {})
                            msg.channel.send(':white_check_mark: 등록 완료! DM으로 클라이언트 ID와 Secret을 확인해주세요!')
                            msg.author.send(`ClientID: \`${cid}\`\nClient Secret: \`${csecret}\`\n**이 ID와 Secret은 다시 알려드릴 수 없다는점 기억해주십시오.(필요할경우 NamuTree0345 디엠)**`)
                            return
                        }
                        msg.channel.send(':x: 최대 클라이언트 개수(2개)를 초과했습니다!')
                        return
                    }
                    msg.channel.send(':x: 이미 있는 이름입니다!')
                    return
                })
            })
        } else {
            msg.channel.send(':x: 사용법: !등록 <앱 이름(띄어쓰기 가능)>')
        }
    }
})

client.login(config.token)
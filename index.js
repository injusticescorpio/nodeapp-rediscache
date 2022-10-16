const express=require('express')
const redis=require('redis')
const axios=require('axios')
const PORT=process.env.NODE_PORT || 3000
const REDIS_PORT=process.env.REDIS_PORT || 6379;

// const client=redis.createClient(REDIS_PORT)

(async () => {
    client = redis.createClient(REDIS_PORT);
  
    client.on('error', (err) => console.log('Redis Client Error', err));
  
    await client.connect();
    
  })();

const app = express()

//set response

function setResponse(username,repos){
    return `<h2> ${username} has ${repos} public repositry<h2>`
}


//Make req to github for data


async function getRepos(req, res,next) {
    try {
        console.log("fetching data...")
        const {username}=req.params
        const response= await axios({
            method: 'GET',
            url:`https://api.github.com/users/${username}/repos`
    })
    const data=response.data
    const total_repos = data.length
    //set data to redis
    await client.set(username,total_repos,{
        EX: 10,})

    res.send(setResponse(username,total_repos))
        }catch(err) {
        console.error(err)
        res.status(500).send({'error': err})
    }

}

async function cacheRepo(req, res, next) {
    const {username}=req.params
    client.get(username).then(data => {
        if(data!==null){
            res.send(setResponse(username,data));
        }else{
        next()
        }
    }).catch(err=>{
        throw err
    })

}

app.get('/repos/:username',cacheRepo,getRepos)




app.listen(PORT, function(){
    console.log(`listening on port ${PORT}`)
})
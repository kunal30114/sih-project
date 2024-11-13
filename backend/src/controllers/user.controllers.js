import {asyncHandler} from '../utils/asynchandler.js'
import axios from 'axios'


const callModel = asyncHandler(async (req, res)=>{

    const { query } = req.body

<<<<<<< Updated upstream
    const response = await axios.post('http://localhost:5000/predict',{query},{
=======
    const response = await axios.post(`http://localhost:5000/predict`, { query },{
>>>>>>> Stashed changes
        withCredentials : true
    })

    res.json({
        message : response.data.message
    })
})

export {
    callModel
}
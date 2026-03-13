import 'dotenv/config'
import express from 'express'
import router from './src/routes/routes.js';


const app = express();
app.use(express.json());

const PORT = process.env.PORT

app.use('/api', router);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
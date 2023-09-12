// esse arquivo serve para configurar qual vai ser a base de dados utilizada.
import "dotenv/config"

export default {
    url: process.env.MONGODB_URI,
}
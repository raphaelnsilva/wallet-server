// lib para fazer a interaçõo com o mongoDBm, essa é uma rotina de conexão com o banco de dados 

import mongoose from "mongoose";
// import das configurações da base de dados utilizada
import config from '../config/database'

class Database {
  constructor() {
    //estabelece a conexão com o mongoDB
    this.connection = mongoose.connect(config.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
}

export default new Database();

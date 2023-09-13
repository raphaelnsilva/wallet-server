import * as Yup from "yup";
import parsePhoneNumber from "libphonenumber-js";
import { cpf, cnpj } from "cpf-cnpj-validator";
import valid from 'card-validator';
import Cart from "../models/Cart";
import TransactionService from "../services/TransactionService";

class TransactionsController {
  async create(req, res) {
    try {

      const {
        cartCode,
        paymentType,
        installments,
        customerName,
        customerEmail,
        customerMobile,
        customerDocument,
        billingAddress,
        billingNumber,
        billingNeighborhood,
        billingCity,
        billingState,
        billingZipCode,
        creditCardNumber,
        creditCardExpiration,
        creditCardHolderName,
        creditCardCvv,
      } = req.body; 

      const schema = Yup.object({

        // carrinho e formas de pagamento 
        cartCode: Yup.string().required(),
        paymentType: Yup.mixed().oneOf(["credit_card", "billet"]).required(),
        installments: Yup.number().min(1).test(
          "text-max-installments", 
          "installment must be less than or equal to 12", 
          (value) => paymentType === "credit_card" ? value <= 12 : value <= 1
        ),
        
        // dados do comprador 
        customerName: Yup.string().required().min(3).max(40).matches(
          /^[A-Za-z ]*$/, 'Please enter valid name'
        ),
        customerEmail: Yup.string().required().email(),
        
        customerMobile: Yup.string().min(10).required().test(
          "is-valid-mobile", 
          "${path} is not a mobile number", 
          (value) => parsePhoneNumber(value, "BR").isValid()
        ),
        customerDocument: Yup.string().required().test(
          "is-valid-document",
          "${path} is not a valid CPF / CNPJ", 
          (value) => cpf.isValid(value) || cnpj.isValid(value)
        ),
        
        // endereço 
        billingAddress: Yup.string().required(),
        billingNumber: Yup.string().required(),
        billingNeighborhood: Yup.string().required(),
        billingCity: Yup.string().required(),
        billingState: Yup.string().required(),
        billingZipCode: Yup.string().required().matches(/^\d{5}-\d{3}$/, "CEP inválido"),
 
        // cartão de credito 
        creditCardNumber: Yup.string().when(
          "paymentType", (paymentType, schema) => 
          paymentType === "credit_card" ? schema.required() : 
          schema.test(value => valid.number(value).isValid)
        ),
        creditCardExpiration: Yup.string().when(
          "paymentType", (paymentType, schema) => 
          paymentType === "credit_card" ? schema.required() : 
          schema.test(value => valid.expirationDate(value).isValid)
        ),
        creditCardHolderName: Yup.string().when(
          "paymentType",(paymentType, schema) => 
          paymentType === "credit_card" ? schema.required() : 
          schema.test(value => valid.cardholderName(value).isValid)
        ),  
        creditCardCvv: Yup.string().when(
          "paymentType",(paymentType, schema) => 
          paymentType === "credit_card" ? schema.required() :
          schema.test(value => valid.cvv(value).isValid)
        )
      });
      
      // O schema do (req.body) não é valido?
      // se o Schema for valido ele irá continuar a execução.
      if(!(await schema.isValid(req.body))) {
        return res.status(400).json({
          error: "Error on validate schema.",
        })   
      }

      // Verificação para verificar se existe carrinho
      const cart = Cart.findOne({ code: cartCode });
      if (!cart) {
        return res.status(404).json();
      }

      // 1. criar o transaction (registro)
      // 2. integrar com o pagarme
      // 3. processar regras (status)

      // a variavel service agora é uma instância de TransactionService
      const service = new TransactionService();
      const response = await service.process({
        cartCode,
        paymentType,
        installments,
        customer: {
          name: customerName,
          email: customerEmail,
          mobile: customerMobile,
          document: customerDocument,
        },
        billing: {
          address: billingAddress,
          number: billingNumber,
          neighborhood: billingNeighborhood,
          city: billingCity,
          state: billingState,
          zipcode: billingZipCode,
        },
        creditCard:{
          number: creditCardNumber,
          expiration: creditCardExpiration,
          holderName: creditCardHolderName,
          cvv: creditCardCvv,
        },
      });
      return res.status(200).json(response);

    } catch (err) {
      console.error(err);
      return res.status(500).json({error: "Internal server error."});
    };
  };
};

export default new TransactionsController();
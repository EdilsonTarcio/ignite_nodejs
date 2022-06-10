const express = require("express");
const {v4: uuidv4} = require("uuid");

const app = express();

app.use(express.json());

const customers = [];
// Vetor para armazenar os dados temporarios

function verifyIfExistsAccountCPF(request, response, next) { //Middleware

  const { cpf } = request.headers;

  const customer = customers.find(customer => customer.cpf === cpf);
  //"find()" irá varrer o vetor customers e procurar pelo cpf informado

  if(!customer) {
    return response.status(400).json({ error: "Cliente não localizado!"})
  }

  request.customer = customer; 
  //exportando o valor do customer a todas as rotas que utilizarem o Middleware

  return next();
  // é uma função

}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    /**reduce((var1, var2)=>{valor_do_var1},valor_do_var2) função para tratar
     * os valores que forem passados na var1 que é um acumulador e o var2 
     * que é o objeto para interação
    **/

    if(operation.type === 'credit') {
      return acc + operation.amount;
    } else {
      return acc - operation.amount
    }
  }, 0); //valor que vai iniciar o reduce
  return balance;
}

app.post("/account", (request, response) => { //criar conta
  const {cpf, name} = request.body;
  // recebe o nome e cpf

  const customerAlreadyExists = customers.some( 
    // some() retorna verdadeiro se satisfazer a operação abaixo
    (customer) => customer.cpf === cpf  
  );

  if (customerAlreadyExists) { // em caso de verdadeiro
    return response.status(400).json(
      {error: "Cliente já cadastrado!"});
  }

  customers.push({ // envio de informações para o vetor de dados
    cpf,
    name,
    id: uuidv4(),
    statement: []
  });

  return response.status(201).send(); // send() envia solicitação para o servidor

});

app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  //recuperando o valor de customer de dentro do middleware

  return response.json(customer.statement);
  // caso ache irá trazer o statement referente o cpf do usuario

});

app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;
  // tem que passar esses valores para o customers

  const {customer} = request; // resgatar o customer de dentro do Middleware

  const statementOperacion = { //função de operações 
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  }

  customer.statement.push(statementOperacion);
  // passando os valores da função para dentro de statement no vetor de dados

  return response.status(201).send(); // send() envia solicitação para o servidor
});

app.post("/withdaw", verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body; // recebendo o valor de saque

  const {customer} = request;
  // rescagatando o valor de customer

  const balance = getBalance (customer.statement);

  if (balance < amount) { //verifica se o valor do saque é menor do que tem em conta
    return response.status(400).json({error: "Saldo insuficiente!"});
  }

  const statementOperacion = {
    amount,
    created_at: new Date(),
    type: "debit"
  };

  customer.statement.push(statementOperacion);

  return response.status(201).send();
});

app.listen(3333);
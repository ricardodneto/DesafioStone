'use strict';
 
const axios = require('axios');
const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Image } = require('dialogflow-fulfillment');

 
process.env.DEBUG = 'dialogflow:debug';
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function getUrl(url) {
    return  axios.get(url);
  }
 
  function planos(agent) {
    let plano = agent.parameters.planos;

    if( plano =='basico') {
      plano = 'ton';
    }

    let url = `https://api.lojastonemais.com.br/products?catalog=${plano}`;

    return getUrl(url).then(response => {
        let newArray = [];
        
        for(let item of response.data.products) {
          newArray.push(item.name+' - '+item.title);
        }

        var bot_response = "As maquininhas disponiveis nesse plano são: " + newArray + ". Gostaria de conhecer melhor alguma delas?";

        agent.add(bot_response);

    })
    .catch (error => {
      agent.add(error);
    });
  }

  function produtos(agent) {
    let produtoEscolhido = agent.parameters.produtos;
    let plano = agent.parameters.planos;

    if( plano =='basico') {
      plano = 'ton';
    }

    let url = `https://api.lojastonemais.com.br/products?catalog=${plano}`;
    let imagem;
    
    return getUrl(url).then(response => { 
      let ArrayProduto = response.data.products.filter((item) => item.name == produtoEscolhido);

      imagem = ArrayProduto[0].img_url;
      agent.add("Essa é a "+produtoEscolhido+":");
      agent.add(new Image(imagem));
      agent.add(`As principais características dela são: ${ArrayProduto[0].highlights[0]}. Gostaria de conhecer o valor de adesão dessa máquina ou conhecer outras opções?`);
    })
    .catch (error => {
      agent.add("Escreva o nome do produto corretamente, por favor.");
    });
  }

  function valor(agent) {
    let produtoEscolhido = agent.parameters.produtos;
    let planos = agent.parameters.planos;

    if( planos =='basico') {
    	planos = 'ton';
    }
      let url = `https://api.lojastonemais.com.br/products?catalog=${planos}`;

      return getUrl(url).then(response => { 
        let ArrayProduto = response.data.products.filter((item) => item.name ==produtoEscolhido);
        let valor = parseFloat(ArrayProduto[0].amount);

        valor = valor.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'});

        agent.add(`O Valor de adesão da ${produtoEscolhido} é de: ${valor} e você pode parcelar em até 12x sem juros!`);
        agent.add("Gostaria de saber mais alguma coisa?");
    	})
      .catch (error => {
        agent.add("Ainda não possuimos outras opções, caso queira saber valor, digite: valor");
    });
  }

  function prazo(agent) {
    let produto = agent.parameters.produtos;
    let plano = agent.parameters.planos;

    if( plano =='basico') {
      plano = 'ton';
  	}
    let url = `https://api.lojastonemais.com.br/products?catalog=${plano}`;

    return getUrl(url).then(response => { 
      let ArrayProduto = response.data.products.filter((item) => item.name ==produto);
      let prazoMax = ArrayProduto[0].shipping_time.max;
      let prazoMin = ArrayProduto[0].shipping_time.min;

      agent.add("A "+produto+" é entregue a você entre "+prazoMin+" e "+prazoMax+" dias úteis. Te ajudo em algo mais?");
    })
    .catch (error => {
      agent.add(error);
  	});      
  }

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Escolha de Planos',planos);
  intentMap.set('Escolha de Produtos',produtos);
  intentMap.set('Valor do Produto',valor);
  intentMap.set('Prazo de entrega',prazo);
  agent.handleRequest(intentMap);
});

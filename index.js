// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const axios = require('axios');
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion,Image} = require('dialogflow-fulfillment');

 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
      
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }
   function getUrl(url){
    return  axios.get(url);
}
 
function planos(agent){
  let plano = agent.parameters.planos;
 if( plano =='basico'){
    plano = 'ton';
  }
  let url = 'https://api.lojastonemais.com.br/products?catalog='+plano;
  return getUrl(url).then(response => {
      let newArray = [];
      for(let item of response.data.products ){
          newArray.push(item.name+' - '+item.title);
      }
      var bot_response = "As maquininhas disponiveis nesse plano são: " + newArray + ". Gostaria de conhecer melhor alguma delas?";

      console.log(bot_response);
        agent.add(bot_response);

  }).catch (error => {
      console.log("Something is wrong  !! ");
      console.log(error);
      agent.add(error);
  });
}
  function produtos(agent) {
  let produtoEscolhido = agent.parameters.produtos;
  let plano = agent.parameters.planos;
  if( plano =='basico'){
    plano = 'ton';
  }
  let url = 'https://api.lojastonemais.com.br/products?catalog='+plano;
  let imagem;
  
 return getUrl(url).then(response => 
	{ 
    	let ArrayProduto = response.data.products.filter((item) => item.name ==produtoEscolhido);
    	imagem = ArrayProduto[0].img_url;
        agent.add("Essa é a "+produtoEscolhido+":");
        agent.add(new Image(imagem));
  		agent.add("As principais características dela são:"+ArrayProduto[0].highlights[0]+
                  " Gostaria de conhecer o valor de adesão dessa máquina ou conhecer outras opções?");
   	
	}).catch (error => {
      console.log("Something is wrong  !! ");
      console.log(error);
      agent.add("Escreva o nome do produto corretamente, por favor.");
  });

    
  }

  function valor(agent) {
      let produtoEscolhido = agent.parameters.produtos;
      let planos = agent.parameters.planos;
     if( planos =='basico'){
    	planos = 'ton';
  	  }
      let url = 'https://api.lojastonemais.com.br/products?catalog='+planos;
      return getUrl(url).then(response => 
		{ 
          let ArrayProduto = response.data.products.filter((item) => item.name ==produtoEscolhido);
          let valor = parseFloat(ArrayProduto[0].amount);
          valor = valor.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'});
          agent.add("O Valor de adesão da "+produtoEscolhido+" é de: "+valor+" e você pode parcelar em até 12x sem juros!");
      	  agent.add("Gostaria de saber mais alguma coisa?");
    	}).catch (error => {
      console.log("Something is wrong  !! ");
      console.log(error);
      agent.add("Ainda não possuimos outras opções, caso queira saber valor, digite: valor");
  });

  }
  function prazo(agent) {
    let produto = agent.parameters.produtos;
    let plano = agent.parameters.planos;
    if( plano =='basico'){
    plano = 'ton';
  	}
    let url = 'https://api.lojastonemais.com.br/products?catalog='+plano;
    return getUrl(url).then(response => 
	{ 
     let ArrayProduto = response.data.products.filter((item) => item.name ==produto);
     let prazoMax = ArrayProduto[0].shipping_time.max;
     let prazoMin = ArrayProduto[0].shipping_time.min;
     agent.add("A "+produto+" é entregue a você entre "+prazoMin+" e "+prazoMax+" dias úteis. Te ajudo em algo mais?");
    }).catch (error => {
      console.log("Something is wrong  !! ");
      console.log(error);
      agent.add(error);
  	});

      
  }
  // // Uncomment and edit to make your own intent handler
  // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function yourFunctionHandler(agent) {
  //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
  //   agent.add(new Card({
  //       title: `Title: this is a card title`,
  //       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
  //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
  //       buttonText: 'This is a button',
  //       buttonUrl: 'https://assistant.google.com/'
  //     })
  //   );
  //   agent.add(new Suggestion(`Quick Reply`));
  //   agent.add(new Suggestion(`Suggestion`));
  //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
  // }

  // // Uncomment and edit to make your own Google Assistant intent handler
  // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function googleAssistantHandler(agent) {
  //   let conv = agent.conv(); // Get Actions on Google library conv instance
  //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
  //   agent.add(conv); // Add Actions on Google library responses to your agent's response
  // }
  // // See https://github.com/dialogflow/fulfillment-actions-library-nodejs
  // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Escolha de Planos',planos);
  intentMap.set('Escolha de Produtos',produtos);
  intentMap.set('Valor do Produto',valor);
  intentMap.set('Prazo de entrega',prazo);
  // intentMap.set('your intent name here', yourFunctionHandler);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});

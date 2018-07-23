if (process.env.NODE_ENV === 'production'){
  module.exports=require('./keys_prod');
}else{
  module.exports=require('./keys_dev');
}

module.exports={
  mongoURI: 'mongodb://adanoji:danoji123@ds127771.mlab.com:27771/dev_adanoji',
  secretOrKey:'secret'
};

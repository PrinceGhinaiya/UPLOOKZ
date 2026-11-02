import Razorpay from 'razorpay';
console.log('Razorpay class type:', typeof Razorpay);
const instance = new Razorpay({
  key_id: 'rzp_test_sample',
  key_secret: 'sample_secret'
});
console.log('Razorpay orders API available:', typeof instance.orders?.create === 'function');

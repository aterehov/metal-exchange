function log(
  req: any, 
  res: any, 
  next: any) {
  //app.use("*", (req, res, next) => {
  console.log("Request time:", new Date());
  console.log("Request source IP:", req.ip);
  console.log("Request path:", req.path);
  console.log("Request parameters:", req.query);
  console.log("Request body:", req.body);
  next();
}

export default log;
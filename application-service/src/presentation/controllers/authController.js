import jsonwebtoken from "jsonwebtoken";



export const generate = (req, res, next) => {
  /*
  #swagger.tags = ["Authentication"]
  #swagger.description = 'Generate JWT token after successful login'
  #swagger.responses[200] = { 
    description: 'Token generated successfully',
    schema: { 
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
    }
  }
  #swagger.responses[401] = { 
    description: 'Unauthorized'
  }
  */
  if (!req.user) {
    return res.unauthorized();
  }

  const payload = {
    email: req.user.email,
    id: req.user.id
  };

  const JWTSECRET = process.env.JWTSECRET;
  const JWTEXPIRE = process.env.JWTEXPIRE;

  const token = jsonwebtoken.sign(payload, JWTSECRET, {
    expiresIn: JWTEXPIRE,
  });

  res.ok({ token });
}

export const verify = async (req, res, next) => {
  /*
  #swagger.autoHeaders = false
  #swagger.security = [{
    "bearerAuth": []
  }]
  */
  const authHeader = req.headers.authorization;
  console.log(authHeader)
  if (authHeader) {
    const token = authHeader.split(" ")[1];

    const JWTSECRET = process.env.JWTSECRET;
    return jsonwebtoken.verify(token, JWTSECRET, (err, payload) => {
      if (err) return next(err);

      req.payload = payload;
      req.user = { id: payload.id, email: payload.email };

      return next();
    });
  }

  res.unauthorized();
}

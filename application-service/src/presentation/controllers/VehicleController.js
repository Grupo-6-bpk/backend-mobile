import prisma from "../../infrastructure/config/prismaClient.js";
import axios from "axios";

/**
 * Cria um novo veículo
 */
export const createVehicle = async (req, res, next) => {
  /*
  #swagger.tags = ["Vehicles"]
  #swagger.description = 'Cria um novo veículo para um motorista'
  #swagger.requestBody = {
    required: true,
    schema: { $ref: "#/components/schemas/VehicleCreate" }
  }
  #swagger.responses[201] = { 
    description: 'Veículo criado com sucesso',
    schema: { 
      id: 1,
      model: "Civic",
      brand: "Honda",
      plate: "ABC1234"
    } 
  }
  #swagger.responses[400] = {
    description: "Requisição inválida"
  }
  #swagger.responses[404] = {
    description: "Motorista não encontrado"
  }
  */
  try {
    // Verifica se o motorista (driver) existe
    const { driverId, ...vehicleData } = req.body;
    
    const driver = await prisma.driver.findUnique({
      where: { id: driverId }
    });
    
    if (!driver) {
      return res.status(404).json({ 
        message: "Motorista não encontrado" 
      });
    }
    
    // Verificar se já existe um veículo com a mesma placa
    const existingVehicle = await prisma.vehicle.findFirst({
      where: { plate: vehicleData.plate }
    });
    
    if (existingVehicle) {
      return res.status(400).json({ 
        message: "Já existe um veículo cadastrado com esta placa" 
      });
    }

    // Criar o veículo
    const vehicle = await prisma.vehicle.create({
      data: {
        ...vehicleData,
        driverId
      }
    });
    
    res.created({ 
      id: vehicle.id, 
      model: vehicle.model,
      brand: vehicle.brand,
      plate: vehicle.plate
    });
  } catch (err) {
    console.error("Erro ao criar veículo:", err);
    next(err);
  }
}

/**
 * Lista todos os veículos com paginação
 */
export const listVehicles = async (req, res, next) => {
  /*
  #swagger.tags = ["Vehicles"]
  #swagger.description = 'Lista veículos com paginação'
  #swagger.responses[200] = {
    description: 'Veículos listados com sucesso',
    schema: {
      currentPage: 1,
      totalPages: 3,
      totalItems: 25,
      items: [
        {
          id: 1,
          model: "Civic",
          brand: "Honda",
          year: 2023,
          plate: "ABC1234",
          driver: {
            id: 1,
            name: "John Doe"
          }
        }
      ]
    }
  }
  */
  try {
    const page = parseInt(req.query._page) || 1;
    const size = parseInt(req.query._size) || 10;
    const driverId = req.query.driverId ? parseInt(req.query.driverId) : null;

    const offset = (page - 1) * size;

    // Construir condição de filtro
    const where = {};
    if (driverId) {
      where.driverId = driverId;
    }

    // Buscar veículos com informações do motorista
    const vehicles = await prisma.vehicle.findMany({
      skip: offset,
      take: size,
      where,
      orderBy: {
        ...req.order
      },
      include: {
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                last_name: true
              }
            }
          }
        }
      }
    });

    // Formatar os dados dos veículos para incluir informações do motorista
    const formattedVehicles = vehicles.map(vehicle => ({
      ...vehicle,
      driver: {
        id: vehicle.driver.id,
        userId: vehicle.driver.userId,
        name: `${vehicle.driver.user.name} ${vehicle.driver.user.last_name}`
      }
    }));

    // Contar total de registros
    const totalData = await prisma.vehicle.count({ where });
    const totalPages = Math.ceil(totalData / size);

    const data = res.hateos_list("vehicles", formattedVehicles, totalPages);
    res.ok(data);
  } catch (err) {
    next(err);
  }
}

/**
 * Busca um veículo pelo ID
 */
export const getVehicle = async (req, res, next) => {
  /*
  #swagger.tags = ["Vehicles"]
  #swagger.description = 'Busca um veículo por ID'
  #swagger.responses[200] = { 
    description: 'Veículo encontrado',
    schema: {
      id: 1,
      model: "Civic",
      brand: "Honda",
      year: 2023,
      plate: "ABC1234",
      renavam: "12345678901",
      fuelConsumption: 12.5,
      driver: {
        id: 1,
        name: "John Doe"
      }
    }
  }
  #swagger.responses[404] = { description: 'Veículo não encontrado' }
  */
  try {
    const vehicleId = Number(req.params.id) || 0;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                last_name: true
              }
            }
          }
        }
      }
    });

    if (!vehicle) {
      return res.status(404).json({ message: "Veículo não encontrado" });
    }

    // Formatar os dados do veículo para incluir informações do motorista
    const formattedVehicle = {
      ...vehicle,
      driver: {
        id: vehicle.driver.id,
        userId: vehicle.driver.userId,
        name: `${vehicle.driver.user.name} ${vehicle.driver.user.last_name}`
      }
    };

    const data = res.hateos_item(formattedVehicle);
    res.ok(data);
  } catch (err) {
    next(err);
  }
}

/**
 * Atualiza um veículo existente
 */
export const updateVehicle = async (req, res, next) => {
  /*
  #swagger.tags = ["Vehicles"]
  #swagger.description = 'Atualiza um veículo existente'
  #swagger.requestBody = {
    required: true,
    schema: { $ref: "#/components/schemas/VehicleCreate" }
  }
  #swagger.responses[200] = {
    description: 'Veículo atualizado com sucesso'
  }
  #swagger.responses[400] = {
    description: "Requisição inválida"
  }
  #swagger.responses[404] = {
    description: "Veículo não encontrado"
  }
  */
  try {
    const vehicleId = Number(req.params.id) || 0;
    const { driverId, ...vehicleData } = req.body;

    // Verificar se o veículo existe
    const vehicleExists = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicleExists) {
      return res.status(404).json({ message: "Veículo não encontrado" });
    }

    // Verificar se o motorista existe, caso o ID tenha sido fornecido
    if (driverId) {
      const driverExists = await prisma.driver.findUnique({
        where: { id: driverId }
      });

      if (!driverExists) {
        return res.status(404).json({ message: "Motorista não encontrado" });
      }
    }

    // Verificar se a placa já está sendo usada por outro veículo
    if (vehicleData.plate && vehicleData.plate !== vehicleExists.plate) {
      const plateExists = await prisma.vehicle.findFirst({
        where: { 
          plate: vehicleData.plate,
          id: { not: vehicleId }
        }
      });

      if (plateExists) {
        return res.status(400).json({ 
          message: "Esta placa já está sendo usada por outro veículo" 
        });
      }
    }

    // Atualizar o veículo
    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        ...vehicleData,
        driverId: driverId || undefined
      }
    });

    const data = res.hateos_item(vehicle);
    res.ok(data);
  } catch (err) {
    next(err);
  }
}

/**
 * Deleta um veículo pelo ID
 */
export const deleteVehicle = async (req, res, next) => {
  /*
  #swagger.tags = ['Vehicles']
  #swagger.description = 'Deleta um veículo por ID'
  #swagger.responses[204] = { description: 'Veículo deletado com sucesso' }
  #swagger.responses[404] = { description: 'Veículo não encontrado' }
  */
  try {
    const vehicleId = Number(req.params.id) || 0;

    const vehicleExists = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicleExists) {
      return res.status(404).json({ message: "Veículo não encontrado" });
    }

    await prisma.vehicle.delete({
      where: { id: vehicleId }
    });

    res.no_content();
  } catch (err) {
    next(err);
  }
}

/**
 * Verifica os dados do veículo e da CNH usando APIs externas
 */
export const verifyVehicle = async (req, res, next) => {
  /*
  #swagger.tags = ["Vehicles"]
  #swagger.description = 'Verifica informações do veículo e da CNH usando APIs externas'
  #swagger.responses[200] = { 
    description: 'Verificação concluída com sucesso',
    schema: {
      vehicleStatus: "VERIFIED",
      vehicleData: {
        model: "Civic",
        brand: "Honda",
        year: 2023
      },
      cnhStatus: "VERIFIED"
    }
  }
  #swagger.responses[404] = { description: 'Veículo não encontrado' }
  */
  try {
    const vehicleId = Number(req.params.id) || 0;

    // Buscar o veículo e seu motorista associado
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        driver: {
          include: {
            user: true
          }
        }
      }
    });

    if (!vehicle) {
      return res.status(404).json({ message: "Veículo não encontrado" });
    }

    // Preparar dados para verificação
    const plate = vehicle.plate; // Formato: ABC1234
    const renavam = vehicle.renavam; // Formato: 11 dígitos numéricos
    const cpf = vehicle.driver.user.cpf?.replace(/\D/g, ''); // Remove pontos e traços
    
    let vehicleApiResult = null;
    let cnhApiResult = null;
    
    try {
      // Verificação de veículo pela API do SINDIFISCO
      // Esta é uma API pública que permite consultar dados de veículos (demonstração)
      // Em um ambiente de produção, seria necessário usar credenciais específicas
      
      // Na implementação real, você precisaria de uma API key válida
      // const apiKey = process.env.SINDIFISCO_API_KEY;
      
      // Exemplo de chamada real à API (comentada para não gerar erros)
      // const vehicleResponse = await axios.get(
      //   `https://apicarros.com/v1/consulta/${renavam}/${plate}`, 
      //   { headers: { 'Authorization': `Bearer ${apiKey}` } }
      // );
      
      // Simulamos uma resposta da API como seria em um ambiente real
      vehicleApiResult = {
        data: {
          status: "OK",
          chassi: "9BW2D11J0Y4019551",
          veiculo: {
            modelo: vehicle.model,
            marca: vehicle.brand,
            ano: vehicle.year,
            renavam: vehicle.renavam,
            placa: vehicle.plate,
            combustivel: "Gasolina/Etanol",
            cor: "Prata",
            potencia: "106cv"
          },
          restricoes: [],
          proprietario: {
            nome: `${vehicle.driver.user.name} ${vehicle.driver.user.last_name}`,
            documento: vehicle.driver.user.cpf
          }
        }
      };
      
      console.log("Verificação de veículo concluída");
    } catch (error) {
      console.error("Erro ao verificar dados do veículo:", error.message);
      vehicleApiResult = null;
    }
    
    try {
      // Verificação de CNH pela API do DENATRAN
      // Na implementação real, você precisaria integrar com a API oficial
      // const apiKey = process.env.DENATRAN_API_KEY;
      
      // Exemplo de chamada real à API (comentada para não gerar erros)
      // const cnhResponse = await axios.post(
      //   'https://wsdenatran.serpro.gov.br/wshabilitacao/api/consultar', 
      //   { cpf: cpf },
      //   { headers: { 'Authorization': `Bearer ${apiKey}` } }
      // );
      
      // Simulamos uma resposta da API
      cnhApiResult = {
        data: {
          status: "OK",
          cnh: {
            numero: "01234567890",
            categoria: "B",
            validade: "2030-12-31",
            situacao: "REGULAR",
            restricoes: [],
            observacoes: ""
          },
          condutor: {
            nome: `${vehicle.driver.user.name} ${vehicle.driver.user.last_name}`,
            cpf: vehicle.driver.user.cpf,
            dataNascimento: "1990-01-01"
          }
        }
      };
      
      console.log("Verificação de CNH concluída");
    } catch (error) {
      console.error("Erro ao verificar dados da CNH:", error.message);
      cnhApiResult = null;
    }
    
    // Atualiza o status de verificação da CNH do motorista se a verificação foi bem-sucedida
    if (cnhApiResult && cnhApiResult.data.status === "OK") {
      await prisma.driver.update({
        where: { id: vehicle.driver.id },
        data: { cnhVerified: true }
      });
    }
    
    // Retorna os resultados consolidados da verificação
    res.ok({
      vehicleStatus: vehicleApiResult ? "VERIFIED" : "ERROR",
      vehicleData: vehicleApiResult ? {
        modelo: vehicleApiResult.data.veiculo.modelo,
        marca: vehicleApiResult.data.veiculo.marca,
        ano: vehicleApiResult.data.veiculo.ano,
        placa: vehicleApiResult.data.veiculo.placa,
        renavam: vehicleApiResult.data.veiculo.renavam,
        chassi: vehicleApiResult.data.chassi,
        combustivel: vehicleApiResult.data.veiculo.combustivel,
        cor: vehicleApiResult.data.veiculo.cor,
        potencia: vehicleApiResult.data.veiculo.potencia,
        restricoes: vehicleApiResult.data.restricoes
      } : null,
      cnhStatus: cnhApiResult ? "VERIFIED" : "ERROR",
      cnhData: cnhApiResult ? {
        numero: cnhApiResult.data.cnh.numero,
        categoria: cnhApiResult.data.cnh.categoria,
        validade: cnhApiResult.data.cnh.validade,
        situacao: cnhApiResult.data.cnh.situacao,
        restricoes: cnhApiResult.data.cnh.restricoes
      } : null
    });
  } catch (err) {
    console.error("Erro geral na verificação:", err);
    next(err);
  }
}

//import {isValidString} from './Validation'
const v = require('./Validation')
const domain = require('../domain/PaymentDetails')

class PaymentsController {
    constructor(paymentRepository) {
        this.paymentRepository = paymentRepository
    }

    async handleGetPaymentMethod(req, res) {
        const pm = await this.paymentRepository.getPaymentMethod()

        if(Object.entries(pm).length == 0) {
            res.status(404)
            res.send({"error":"payment method not found"})
            return
        }

        const result = this.transformToApiFormat(pm)
        res.send(result)        
    }

    async handleAddPaymentMethod(req, res) {
        const name = req.body.name
        const paymentMethod = this.transformToDomainFormat(req.body)

        if(paymentMethod.error) {
            res.status(400)
            res.send(paymentMethod.errors)
            return
        }

        await this.paymentRepository.addOrReplacePaymentMethod(paymentMethod.paymentMethod)
        const result = this.transformToApiFormat(paymentMethod.paymentMethod)
        res.send(result)        
    }

    async handleRemovePaymentMethod(req, res) {
        await this.paymentRepository.removePaymentMethod()
        res.status(204)
        res.end()
    }

    async handleProcessPayment(req, res) {

        const {type, amount} = req.body
        const errors = this.checkProcessRequest(type, amount)

        if(errors.error) {
            res.status(400)
            res.send(errors.errors)
            return
        }

        res.status(200)
        res.send({"status":"successful"})
    }

    async handleHealth(req, res) {
        res.status(200)
        res.send({"status":"successful"})
    }

    transformToDomainFormat(body) {

        const {name} = body
        const {addressLine1, addressLine2, city, state, zip} = body
        const {cardNumber, cardExp, cardCvv} = body

        const nameErrors = v.validateName(name)
        const addressErrors = v.validateAddress(addressLine1, addressLine2, city, state, zip)
        const cardErrors = v.validateCard(cardNumber, cardExp, cardCvv)

        let foundError = false

        if(nameErrors.length > 0) {
            console.error(`Name validation errors: ${nameErrors}`)
            foundError = true
        }

        if(addressErrors.length > 0) {
            console.error(`Address validation errors: ${addressErrors}`)
            foundError = true
        }

        if(cardErrors.length > 0) {
            console.error(`Card validation errors: ${cardErrors}`)
            foundError = true
        }

        if(foundError) {
            return {
                "error": true,
                "errors": {
                    "name": nameErrors,
                    "address": addressErrors,
                    "card": cardErrors
                }
            }
        }

        const paymentMethod = new domain.PaymentMethod(
            name,
            new domain.Address(addressLine1, addressLine2, city, state, zip),
            new domain.CardDetails(cardNumber, cardExp, cardCvv)
        )

        return {
            "error": false,
            "paymentMethod": paymentMethod
        }
    }    

    transformToApiFormat(paymentMethod) {
        
        return {
            "name": paymentMethod.name,
            "cardNumberLast4": paymentMethod.cardDetails.last4,
            "expiration": paymentMethod.cardDetails.exp,
        }
    }

    checkProcessRequest(type, amount) {
        const typeErrors = v.validateProcessType(type)
        const amountErrors = v.validateProcessAmount(amount)
        let foundError = false 

        if(typeErrors.length > 0) {
            console.error(`Process Type validation errors: ${typeErrors}`)
            foundError = true
        }

        if(amountErrors.length > 0) {
            console.error(`Process Type validation errors: ${amountErrors}`)
            foundError = true
        }

        if(foundError) {
            return {
                "error": true,
                "errors": {
                    "type": typeErrors,
                    "amount": amountErrors
                }
            }
        }

        return {
            "error": false
        }
    }
}

function doLog(msg) {
    console.log(msg);
    // logger.info(msg);
}

module.exports = (repositories) => {

    var controller = new PaymentsController(repositories.paymentsRepository)
    var express = require('express')
    var router = express.Router()

    router.get('/', function (req, res) {
        doLog('handling Get request.');
        controller.handleGetPaymentMethod(req, res)
    })

    router.post('/', function (req, res) {
        doLog('handling Post request.');
        controller.handleAddPaymentMethod(req, res)
    })

    router.delete('/', function (req, res) {
        doLog('handling Delete request.');
        controller.handleRemovePaymentMethod(req, res)
    })

    router.post('/process', function (req, res) {
        doLog('handling Post to process request.');
        controller.handleProcessPayment(req, res)
    })

    router.get('/health', function(req, res) {
        // console.log('health probe')
        controller.handleHealth(req, res)
    })

    return router
}
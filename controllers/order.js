import asyncHandler from "express-async-handler";
import Stripe from "stripe";
import Order from "../models/order.js";
import OrderItem from "../models/order-item.js";
import Product from "../models/product.js";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const list = asyncHandler(async (req, res) => {
  Order.find()
    .populate("user", "name")
    .sort({ dateOrdered: -1 }) // newest to oldest
    .exec((err, orders) => {
      if (err) {
        res.status(400).json({
          error: "Orders not found",
        });
      }
      res.json(orders);
    });
});

const create = asyncHandler(async (req, res) => {
  try {
    const orderItemsIds = await Promise.all(
      req.body.orderItems?.map(async (orderItem) => {
        let newOrderItem = new OrderItem({
          quantity: orderItem.quantity,
          product: orderItem.product,
        });

        newOrderItem = await newOrderItem.save();
        return newOrderItem._id;
      })
    );

    const orderItemsIdsResolved = await orderItemsIds;

    const totalPrices = await Promise.all(
      orderItemsIdsResolved?.map(async (orderItemId) => {
        const orderItem = await OrderItem.findById(orderItemId).populate(
          "product",
          "priceAfterDiscount"
        );

        const totalPrice =
          orderItem.product.priceAfterDiscount * orderItem.quantity;

        // Update purchase history for the product
        await Product.findByIdAndUpdate(orderItem.product._id, {
          $push: {
            purchaseHistory: {
              user: req.body.user, // Assuming user ID is passed in the request
              quantity: orderItem.quantity,
              purchaseDate: new Date(),
            },
          },
          $inc: {
            orderCount: orderItem.quantity,
          },
        });

        return totalPrice;
      })
    );

    const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

    let paymentIntent = null;

    if (req.body.createPaymentIntent) {
      paymentIntent = await stripe.paymentIntents.create({
        amount: req.body.amount,
        currency: "aed",
        payment_method_types: ["card"],
      });
    }

    const order = new Order({
      orderItems: orderItemsIdsResolved,
      shippingAddress1: req.body.shippingAddress1,
      shippingAddress2: req.body.shippingAddress2,
      city: req.body.city,
      zip: req.body.zip || null,
      country: req.body.country,
      phone: req.body.phone,
      totalPrice: totalPrice,
      paymentIntentId: paymentIntent ? paymentIntent.id : null,
      user: req.body.user,
    });

    const createdOrder = await order.save();

    if (!createdOrder) {
      res.status(500).json({
        message: "Order cannot be created",
      });
    }

    res.status(201).json({
      order: createdOrder,
      paymentIntent: paymentIntent ? paymentIntent : null,
      clientSecret: paymentIntent ? paymentIntent.client_secret : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const orderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    });

  if (order) {
    res.json(order);
  } else {
    res.status(404).json({
      message: "Order not Found",
      success: false,
    });
  }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id);

  if (order) {
    order.status = status;

    const updatedOrderStatus = await order.save();
    res.json(updatedOrderStatus);
  } else {
    res.status(404).json({
      message: "Order not Found",
      success: false,
    });
  }
});

const remove = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    await order.remove();
    await order.orderItems.map(async (orderItem) => {
      await OrderItem.findByIdAndRemove(orderItem);
    });
    res.status(200).json({
      success: true,
      message: "Order removed",
    });
  } else {
    res.status(404).json({
      success: false,
      message: "Order not Found",
    });
  }
});

const totalSales = asyncHandler(async (req, res) => {
  const totalSales = await Order.aggregate([
    { $group: { _id: null, totalsales: { $sum: "$totalPrice" } } },
  ]);

  if (!totalSales) {
    res.status(400).json({
      message: "Order sales cannot be generated",
    });
  } else {
    res.json({
      totalsales: totalSales.pop().totalsales,
    });
  }
});

const countOrders = asyncHandler(async (req, res) => {
  const orderCount = await Order.countDocuments();
  if (!orderCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    orderCount: orderCount,
  });
});

const userOrders = asyncHandler(async (req, res) => {
  const userOrderList = await Order.find({
    user: req.params.userid,
  })
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    })
    .sort({
      dateOrdered: -1,
    });
  if (!userOrderList) {
    res.status(500).json({ success: false });
  }
  res.send(userOrderList);
});

const getLastSalesOrders = asyncHandler(async (req, res) => {
  const lastSalesOrders = await Order.find()
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        select: "name price image",
      },
    })
    .sort({ dateOrdered: -1 })
    .limit(6);

  const formattedOrders = lastSalesOrders.map((order) => {
    const totalPrice = order.orderItems.reduce((total, item) => {
      return total + item.product.originalPrice * item.quantity;
    }, 0);

    return {
      id: order.id,
      dateOrdered: order.dateOrdered,
      status: order.status,
      total: totalPrice,
      orderItems: order.orderItems,
    };
  });

  res.json(formattedOrders);
});

export {
  list,
  create,
  orderById,
  updateOrderStatus,
  remove,
  totalSales,
  countOrders,
  userOrders,
  getLastSalesOrders,
};

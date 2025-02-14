import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext.js";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, CreditCard, Landmark, ChevronRight } from "lucide-react";
import { formatPrice } from "../utils/format.js";
import { useAuth } from "../context/AuthContext.js";

type CheckoutStep = "shipping" | "payment" | "confirmation";
type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

interface ShippingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

interface OrderCreate {
  userId: string;
  totalAmount: number;
  shippingDetails: ShippingDetails;
  items: {
    productId: string;
    quantity: number;
    price: number;
    selectedColor?: string;
  }[];
  paymentMethod: "credit_card" | "bank_transfer" | "cod";
  status: "pending";
  slipUrl?: string;
}

const initialShippingDetails: ShippingDetails = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
};

export function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("shipping");
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>(
    initialShippingDetails
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "credit_card" | "bank_transfer" | "cod"
  >("credit_card");
  const [loading, setLoading] = useState(true);
  const [slipImage, setSlipImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setShippingDetails({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        postalCode: user.postalCode || "",
      });
    }
    setLoading(false);
  }, [user]);

  const shippingCost = 50; // Fixed shipping cost
  const totalWithShipping = totalPrice + shippingCost;

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep("payment");
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อ");
      navigate("/login");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Validate slip image for bank transfer
      if (selectedPaymentMethod === "bank_transfer" && !slipImage) {
        throw new Error("กรุณาอัพโหลดสลิปการโอนเงิน");
      }

      // Create order data
      const orderData: OrderCreate = {
        userId: user.id,
        totalAmount: totalPrice + shippingCost,
        shippingDetails,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          selectedColor: item.selectedColor,
        })),
        paymentMethod: selectedPaymentMethod,
        status: "pending" as const,
      };

      let response;

      if (selectedPaymentMethod === "bank_transfer" && slipImage) {
        // For bank transfer with slip
        const formData = new FormData();
        formData.append("orderData", JSON.stringify(orderData));
        formData.append("slip", slipImage);

        response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          body: formData,
        });
      } else {
        // For credit card and COD
        response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData), // Send orderData directly without wrapping
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(errorData.message || "Failed to create order");
      }

      const orderResponseData = await response.json();

      // Clear cart after successful order
      await clearCart();
      setCurrentStep("confirmation");
    } catch (err) {
      console.error("Error creating order:", err);
      setError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmOrder = () => {
    clearCart();
    navigate("/");
    // In a real app, you would also save the order to your backend
  };

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="max-w-4xl px-4 mx-auto sm:px-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div
              className={`flex items-center ${
                currentStep === "shipping" ? "text-black" : "text-gray-400"
              }`}
            >
              <span className="flex items-center justify-center w-8 h-8 mr-2 border-2 rounded-full">
                1
              </span>
              ข้อมูลการจัดส่ง
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <div
              className={`flex items-center ${
                currentStep === "payment" ? "text-black" : "text-gray-400"
              }`}
            >
              <span className="flex items-center justify-center w-8 h-8 mr-2 border-2 rounded-full">
                2
              </span>
              ชำระเงิน
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <div
              className={`flex items-center ${
                currentStep === "confirmation" ? "text-black" : "text-gray-400"
              }`}
            >
              <span className="flex items-center justify-center w-8 h-8 mr-2 border-2 rounded-full">
                3
              </span>
              ยืนยันคำสั่งซื้อ
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2">
            {currentStep === "shipping" && (
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <h2 className="mb-6 text-xl font-semibold">ข้อมูลการจัดส่ง</h2>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-gray-200 rounded-full border-t-black animate-spin"></div>
                  </div>
                ) : (
                  <form onSubmit={handleShippingSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                          ชื่อ
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingDetails.firstName}
                          onChange={(e) =>
                            setShippingDetails({
                              ...shippingDetails,
                              firstName: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                          นามสกุล
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingDetails.lastName}
                          onChange={(e) =>
                            setShippingDetails({
                              ...shippingDetails,
                              lastName: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        อีเมล
                      </label>
                      <input
                        type="email"
                        required
                        value={shippingDetails.email}
                        onChange={(e) =>
                          setShippingDetails({
                            ...shippingDetails,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        เบอร์โทรศัพท์
                      </label>
                      <input
                        type="tel"
                        required
                        value={shippingDetails.phone}
                        onChange={(e) =>
                          setShippingDetails({
                            ...shippingDetails,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        ที่อยู่
                      </label>
                      <textarea
                        required
                        value={shippingDetails.address}
                        onChange={(e) =>
                          setShippingDetails({
                            ...shippingDetails,
                            address: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                          เมือง/จังหวัด
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingDetails.city}
                          onChange={(e) =>
                            setShippingDetails({
                              ...shippingDetails,
                              city: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                          รหัสไปรษณีย์
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingDetails.postalCode}
                          onChange={(e) =>
                            setShippingDetails({
                              ...shippingDetails,
                              postalCode: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 text-white bg-black rounded-lg hover:bg-gray-800"
                    >
                      ดำเนินการต่อ
                    </button>
                  </form>
                )}
              </div>
            )}

            {currentStep === "payment" && (
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <h2 className="mb-6 text-xl font-semibold">
                  เลือกวิธีการชำระเงิน
                </h2>
                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="credit_card"
                        checked={selectedPaymentMethod === "credit_card"}
                        onChange={(e) =>
                          setSelectedPaymentMethod("credit_card")
                        }
                        className="form-radio"
                      />
                      <CreditCard className="w-6 h-6 mr-3" />
                      <div>
                        <p className="font-medium">บัตรเครดิต/เดบิต</p>
                        <p className="text-sm text-gray-500">
                          Visa, Mastercard, JCB
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={selectedPaymentMethod === "bank_transfer"}
                        onChange={(e) =>
                          setSelectedPaymentMethod("bank_transfer")
                        }
                        className="form-radio"
                      />
                      <Landmark className="w-6 h-6 mr-3" />
                      <div>
                        <p className="font-medium">โอนเงินผ่านธนาคาร</p>
                        <p className="text-sm text-gray-500">
                          ธนาคารกรุงเทพ, ไทยพาณิชย์, กสิกร
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={selectedPaymentMethod === "cod"}
                        onChange={(e) => setSelectedPaymentMethod("cod")}
                        className="form-radio"
                      />
                      <CheckCircle2 className="w-6 h-6 mr-3" />
                      <div>
                        <p className="font-medium">ชำระเงินปลายทาง</p>
                        <p className="text-sm text-gray-500">
                          ชำระเงินเมื่อได้รับสินค้า
                        </p>
                      </div>
                    </label>
                  </div>

                  {selectedPaymentMethod === "bank_transfer" && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-gray-50">
                        <p className="mb-2 font-medium">ข้อมูลการโอนเงิน</p>
                        <p className="text-sm text-gray-600">
                          ธนาคารไทยพาณิชย์
                        </p>
                        <p className="text-sm text-gray-600">
                          เลขที่บัญชี: 7142335313
                        </p>
                        <p className="text-sm text-gray-600">
                          ชื่อบัญชี: นางสาว ปิ่นปินันท์ มิ่งขวัญเจริญกิจ
                        </p>
                      </div>

                      <div className="mt-4">
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                          อัพโหลดสลิปการโอนเงิน
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setSlipImage(e.target.files?.[0] || null)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                          required={selectedPaymentMethod === "bank_transfer"}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          รองรับไฟล์ PNG, JPG ขนาดไม่เกิน 5MB
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin" />
                        กำลังดำเนินการ...
                      </div>
                    ) : (
                      `ชำระเงิน ${formatPrice(totalWithShipping)}`
                    )}
                  </button>

                  {error && (
                    <div className="p-4 mt-4 text-red-500 rounded-lg bg-red-50">
                      {error}
                    </div>
                  )}
                </form>
              </div>
            )}

            {currentStep === "confirmation" && (
              <div className="p-6 text-center bg-white rounded-lg shadow-sm">
                <div className="mb-6">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <h2 className="mb-2 text-2xl font-semibold">
                    ขอบคุณสำหรับคำสั่งซื้อ
                  </h2>
                  <p className="text-gray-600">เราได้รับคำสั่งซื้อของคุณแล้ว</p>
                </div>
                <div className="mb-6 text-left">
                  <h3 className="mb-2 font-medium">รายละเอียดการจัดส่ง:</h3>
                  <p className="text-gray-600">
                    {shippingDetails.firstName} {shippingDetails.lastName}
                  </p>
                  <p className="text-gray-600">{shippingDetails.address}</p>
                  <p className="text-gray-600">
                    {shippingDetails.city} {shippingDetails.postalCode}
                  </p>
                  <p className="text-gray-600">{shippingDetails.phone}</p>
                </div>
                <button
                  onClick={handleConfirmOrder}
                  className="w-full py-3 text-white bg-black rounded-lg hover:bg-gray-800"
                >
                  กลับไปหน้าหลัก
                </button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="p-6 bg-white rounded-lg shadow-sm h-fit">
            <h3 className="mb-4 font-semibold">สรุปคำสั่งซื้อ</h3>
            <div className="mb-4 space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-4">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="object-cover w-16 h-16 rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-500">
                      จำนวน: {item.quantity}
                    </p>
                    <p className="font-medium">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 space-y-2 border-t">
              <div className="flex justify-between text-sm">
                <span>ยอดรวม</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>ค่าจัดส่ง</span>
                <span>{formatPrice(shippingCost)}</span>
              </div>
              <div className="flex justify-between pt-2 font-semibold border-t">
                <span>ยอดรวมทั้งหมด</span>
                <span>{formatPrice(totalWithShipping)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

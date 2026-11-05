from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class SaleEvent(BaseModel):
    event_id: str = Field(..., description="Unique event identifier from ESP32 to prevent duplicate logging")
    machine_id: str = Field(default="smartvend_01", description="Identifier of the physical machine")
    slot_id: int = Field(..., ge=1, le=3, description="Vending slot 1, 2, or 3")
    product_id: Optional[str] = Field(None, description="Product ID (optional, slot will map to product if omitted)")
    quantity: int = Field(default=1, ge=1)
    dispense_confirmed: bool = Field(..., description="True only if IR sensor confirmed item fell")

class DeviceHeartbeat(BaseModel):
    machine_id: str = "smartvend_01"
    online_status: bool = True
    wifi_ssid: Optional[str] = "SmartVend_WiFi"
    ip_address: Optional[str] = "192.168.1.105"
    rssi: Optional[int] = -58
    servo_status: Optional[str] = "OK"
    ir_status: Optional[str] = "OK"
    demo_mode: Optional[bool] = False

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None

class ProductCreate(BaseModel):
    product_id: str
    product_name: str
    price: float
    category: str
    slot_id: int
    initial_stock: int
    current_stock: int
    min_stock: int = 3
    image_url: Optional[str] = None
    description: Optional[str] = None

class StockUpdate(BaseModel):
    current_stock: int
    min_stock: Optional[int] = None
    reason: Optional[str] = "Manual adjustment"

class RestockOrder(BaseModel):
    product_id: str
    restock_quantity: int

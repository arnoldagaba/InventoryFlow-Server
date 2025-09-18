import { env } from "#config/env.js";
import { PrismaClient } from "#generated/prisma/client.js";
import { authService } from "#services/user.service.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// 1. Roles and Permissions
const rolesWithPermissions = [
	{
		description: "Full system access",
		name: "Admin",
		permissions: [
			"USERS_VIEW",
			"USERS_CREATE",
			"USERS_UPDATE",
			"USERS_DELETE",
			"INVENTORY_VIEW",
			"INVENTORY_CREATE",
			"INVENTORY_UPDATE",
			"INVENTORY_DELETE",
			"INVENTORY_ADJUST_STOCK",
			"ORDERS_VIEW",
			"ORDERS_CREATE",
			"ORDERS_UPDATE",
			"ORDERS_DELETE",
			"LOCATIONS_MANAGE",
			"SUPPLIERS_MANAGE",
			"REPORTS_VIEW",
			"AUDIT_VIEW",
			"SETTINGS_MANAGE",
		],
	},
	{
		description: "Operations management access",
		name: "Manager",
		permissions: [
			"USERS_VIEW",
			"INVENTORY_VIEW",
			"INVENTORY_CREATE",
			"INVENTORY_UPDATE",
			"INVENTORY_ADJUST_STOCK",
			"ORDERS_VIEW",
			"ORDERS_CREATE",
			"ORDERS_UPDATE",
			"LOCATIONS_MANAGE",
			"SUPPLIERS_MANAGE",
			"REPORTS_VIEW",
			"AUDIT_VIEW",
		],
	},
	{
		description: "Day-to-day operations",
		name: "Operator",
		permissions: [
			"INVENTORY_VIEW",
			"INVENTORY_UPDATE",
			"INVENTORY_ADJUST_STOCK",
			"ORDERS_VIEW",
			"ORDERS_UPDATE",
			"REPORTS_VIEW",
		],
	},
	{
		description: "Read-only access",
		name: "Viewer",
		permissions: ["INVENTORY_VIEW", "ORDERS_VIEW", "REPORTS_VIEW"],
	},
];

// 2. Users (passwords will be hashed)
const users = [
	{
		email: "admin@inventoryflow.com",
		firstName: "System",
		lastName: "Administrator",
		password: "SecureAdmin123!",
		roleName: "Admin",
		username: "admin",
	},
	{
		email: "manager@inventoryflow.com",
		firstName: "Sarah",
		lastName: "Johnson",
		password: "ManagerPass456!",
		roleName: "Manager",
		username: "manager",
	},
	{
		email: "operator@inventoryflow.com",
		firstName: "Mike",
		lastName: "Wilson",
		password: "OperatorPass789!",
		roleName: "Operator",
		username: "operator",
	},
];

// 3. Categories (hierarchical structure)
const categories = [
	{ description: "Electronic devices and components", name: "Electronics", parent: null },
	{ description: "Computing hardware", name: "Computers", parent: "Electronics" },
	{ description: "Portable computers", name: "Laptops", parent: "Computers" },
	{ description: "Desktop computers", name: "Desktops", parent: "Computers" },
	{ description: "Smartphones and tablets", name: "Mobile Devices", parent: "Electronics" },
	{ description: "General office consumables", name: "Office Supplies", parent: null },
	{ description: "Writing materials", name: "Stationery", parent: "Office Supplies" },
	{ description: "Office furniture", name: "Furniture", parent: "Office Supplies" },
];

// 4. Locations (warehouse hierarchy)
const locations = [
	{ code: "WH001", name: "Main Warehouse", parent: null, type: "WAREHOUSE" },
	{ code: "ZONE-A", name: "Electronics Zone", parent: "WH001", type: "ZONE" },
	{ code: "ZONE-B", name: "Office Supplies Zone", parent: "WH001", type: "ZONE" },
	{ code: "A-01", name: "Aisle A1", parent: "ZONE-A", type: "AISLE" },
	{ code: "A-02", name: "Aisle A2", parent: "ZONE-A", type: "AISLE" },
	{ code: "B-01", name: "Aisle B1", parent: "ZONE-B", type: "AISLE" },
	{ code: "A01-S1", name: "Shelf 1", parent: "A-01", type: "SHELF" },
	{ code: "A01-S2", name: "Shelf 2", parent: "A-01", type: "SHELF" },
	{ code: "STORE001", name: "High Street Store", parent: null, type: "STORE" },
];

// 5. Suppliers
const suppliers = [
	{
		address: {
			city: "London",
			country: "United Kingdom",
			line1: "123 Technology Street",
			line2: "Tech Quarter",
			postcode: "EC1A 1BB",
		},
		code: "SUPP001",
		contactPerson: "James Anderson",
		email: "orders@techcorp.co.uk",
		name: "TechCorp Limited",
		paymentTerms: "30 days",
		phone: "+44 20 7123 4567",
	},
	{
		address: {
			city: "Manchester",
			country: "United Kingdom",
			line1: "456 Commerce Road",
			postcode: "M1 2AB",
		},
		code: "SUPP002",
		contactPerson: "Emma Thompson",
		email: "procurement@officeessentials.co.uk",
		name: "Office Essentials UK",
		paymentTerms: "15 days",
		phone: "+44 161 234 5678",
	},
	{
		address: {
			city: "Birmingham",
			country: "United Kingdom",
			line1: "789 Industrial Estate",
			postcode: "B2 4CD",
		},
		code: "SUPP003",
		contactPerson: "David Chen",
		email: "sales@globelectronics.com",
		name: "Global Electronics Supply",
		paymentTerms: "Net 30",
		phone: "+44 121 345 6789",
	},
];

// 6. Inventory Items
const inventoryItems = [
	{
		barcode: "1234567890123",
		brand: "Dell",
		categoryName: "Laptops",
		costPrice: 649.99,
		description: '15.6" business laptop with Intel Core i5 processor, 8GB RAM, 256GB SSD',
		maxStockLevel: 50,
		minStockLevel: 5,
		model: "Latitude 3520",
		name: "Dell Latitude 3520 Laptop",
		sellingPrice: 899.99,
		sku: "LAPTOP-DL-001",
	},
	{
		barcode: "2345678901234",
		brand: "HP",
		categoryName: "Laptops",
		costPrice: 849.99,
		description: '15.6" professional laptop with Intel Core i7, 16GB RAM, 512GB SSD',
		maxStockLevel: 30,
		minStockLevel: 3,
		model: "ProBook 450 G8",
		name: "HP ProBook 450 G8",
		sellingPrice: 1199.99,
		sku: "LAPTOP-HP-002",
	},
	{
		barcode: "3456789012345",
		brand: "Dell",
		categoryName: "Desktops",
		costPrice: 499.99,
		description: "Compact desktop PC with Intel Core i5, 8GB RAM, 256GB SSD",
		maxStockLevel: 20,
		minStockLevel: 2,
		model: "OptiPlex 3080",
		name: "Dell OptiPlex 3080 Desktop",
		sellingPrice: 749.99,
		sku: "DESKTOP-DL-003",
	},
	{
		barcode: "4567890123456",
		brand: "Apple",
		categoryName: "Mobile Devices",
		costPrice: 629.99,
		description: "128GB smartphone in various colours",
		hasVariants: true,
		maxStockLevel: 100,
		minStockLevel: 10,
		model: "iPhone 13",
		name: "Apple iPhone 13",
		sellingPrice: 899.99,
		sku: "MOBILE-APL-004",
	},
	{
		barcode: "5678901234567",
		brand: "ErgoMax",
		categoryName: "Furniture",
		costPrice: 149.99,
		description: "Adjustable ergonomic office chair with lumbar support",
		maxStockLevel: 25,
		minStockLevel: 5,
		name: "ErgoMax Office Chair",
		sellingPrice: 249.99,
		sku: "CHAIR-ERG-005",
	},
	{
		barcode: "6789012345678",
		brand: "WritePro",
		categoryName: "Stationery",
		costPrice: 4.99,
		description: "Pack of 10 high-quality ballpoint pens",
		maxStockLevel: 200,
		minStockLevel: 20,
		name: "Premium Ballpoint Pens (Black)",
		sellingPrice: 9.99,
		sku: "PEN-BLK-006",
		unitOfMeasure: "pack",
	},
	{
		barcode: "7890123456789",
		brand: "PaperPro",
		categoryName: "Stationery",
		costPrice: 3.99,
		description: "80gsm white copy paper, ream of 500 sheets",
		maxStockLevel: 500,
		minStockLevel: 50,
		name: "A4 Copy Paper (500 sheets)",
		sellingPrice: 7.99,
		sku: "PAPER-A4-007",
		unitOfMeasure: "ream",
	},
	{
		barcode: "8901234567890",
		brand: "LG",
		categoryName: "Electronics",
		costPrice: 129.99,
		description: "24-inch LED monitor with 1920x1080 resolution",
		maxStockLevel: 40,
		minStockLevel: 8,
		model: "24MK430H",
		name: 'LG 24" Full HD Monitor',
		sellingPrice: 199.99,
		sku: "MONITOR-LG-008",
	},
	{
		barcode: "9012345678901",
		brand: "Logitech",
		categoryName: "Electronics",
		costPrice: 39.99,
		description: "Wireless keyboard with number pad and long battery life",
		maxStockLevel: 75,
		minStockLevel: 15,
		model: "MK540",
		name: "Logitech Wireless Keyboard",
		sellingPrice: 69.99,
		sku: "KEYBOARD-LOG-009",
	},
	{
		barcode: "0123456789012",
		brand: "Logitech",
		categoryName: "Electronics",
		costPrice: 29.99,
		description: "Ergonomic wireless mouse with precision tracking",
		maxStockLevel: 100,
		minStockLevel: 20,
		model: "M705",
		name: "Logitech Wireless Mouse",
		sellingPrice: 49.99,
		sku: "MOUSE-LOG-010",
	},
];

// 7. iPhone Variants (for item with variants)
const phoneVariants = [
	{
		attributes: { colour: "Black", storage: "128GB" },
		barcode: "4567890123457",
		costPrice: 629.99,
		parentSku: "MOBILE-APL-004",
		sellingPrice: 899.99,
		sku: "MOBILE-APL-004-BLK",
	},
	{
		attributes: { colour: "White", storage: "128GB" },
		barcode: "4567890123458",
		costPrice: 629.99,
		parentSku: "MOBILE-APL-004",
		sellingPrice: 899.99,
		sku: "MOBILE-APL-004-WHT",
	},
	{
		attributes: { colour: "Blue", storage: "128GB" },
		barcode: "4567890123459",
		costPrice: 629.99,
		parentSku: "MOBILE-APL-004",
		sellingPrice: 899.99,
		sku: "MOBILE-APL-004-BLU",
	},
];

// 8. Initial Stock Levels (distributed across locations)
const initialStockLevels = [
	// Main warehouse stock
	{ itemSku: "LAPTOP-DL-001", locationCode: "A01-S1", quantityOnHand: 25, quantityReserved: 2 },
	{ itemSku: "LAPTOP-HP-002", locationCode: "A01-S1", quantityOnHand: 15, quantityReserved: 1 },
	{ itemSku: "DESKTOP-DL-003", locationCode: "A01-S2", quantityOnHand: 12, quantityReserved: 0 },
	{ itemSku: "CHAIR-ERG-005", locationCode: "B-01", quantityOnHand: 18, quantityReserved: 3 },
	{ itemSku: "PEN-BLK-006", locationCode: "B-01", quantityOnHand: 150, quantityReserved: 10 },
	{ itemSku: "PAPER-A4-007", locationCode: "B-01", quantityOnHand: 200, quantityReserved: 25 },
	{ itemSku: "MONITOR-LG-008", locationCode: "A-02", quantityOnHand: 30, quantityReserved: 2 },
	{ itemSku: "KEYBOARD-LOG-009", locationCode: "A-02", quantityOnHand: 45, quantityReserved: 5 },
	{ itemSku: "MOUSE-LOG-010", locationCode: "A-02", quantityOnHand: 75, quantityReserved: 8 },

	// Store stock (retail locations)
	{ itemSku: "LAPTOP-DL-001", locationCode: "STORE001", quantityOnHand: 3, quantityReserved: 1 },
	{ itemSku: "MONITOR-LG-008", locationCode: "STORE001", quantityOnHand: 5, quantityReserved: 0 },
	{
		itemSku: "KEYBOARD-LOG-009",
		locationCode: "STORE001",
		quantityOnHand: 8,
		quantityReserved: 1,
	},

	// iPhone variants stock
	{
		locationCode: "A01-S1",
		quantityOnHand: 12,
		quantityReserved: 2,
		variantSku: "MOBILE-APL-004-BLK",
	},
	{
		locationCode: "A01-S1",
		quantityOnHand: 8,
		quantityReserved: 1,
		variantSku: "MOBILE-APL-004-WHT",
	},
	{
		locationCode: "A01-S1",
		quantityOnHand: 15,
		quantityReserved: 3,
		variantSku: "MOBILE-APL-004-BLU",
	},
];

// 9. Sample Purchase Orders
const purchaseOrders = [
	{
		lines: [
			{
				itemSku: "LAPTOP-DL-001",
				lineNumber: 1,
				quantityOrdered: 20,
				quantityReceived: 20,
				unitPrice: 649.99,
			},
			{
				itemSku: "DESKTOP-DL-003",
				lineNumber: 2,
				quantityOrdered: 10,
				quantityReceived: 10,
				unitPrice: 499.99,
			},
		],
		orderDate: "2024-01-15",
		orderNumber: "PO-2024-001",
		receivedDate: "2024-01-22",
		status: "RECEIVED",
		supplierCode: "SUPP001",
	},
	{
		lines: [
			{
				itemSku: "CHAIR-ERG-005",
				lineNumber: 1,
				quantityOrdered: 15,
				quantityReceived: 12,
				unitPrice: 149.99,
			},
			{
				itemSku: "PEN-BLK-006",
				lineNumber: 2,
				quantityOrdered: 100,
				quantityReceived: 100,
				unitPrice: 4.99,
			},
		],
		orderDate: "2024-02-01",
		orderNumber: "PO-2024-002",
		status: "PARTIALLY_RECEIVED",
		supplierCode: "SUPP002",
	},
];

// 10. Sample Sales Orders
const salesOrders = [
	{
		customerInfo: {
			address: {
				city: "London",
				line1: "100 Business Park",
				postcode: "SW1A 1AA",
			},
			email: "orders@abccorp.co.uk",
			phone: "+44 20 7987 6543",
		},
		customerName: "ABC Corporation Ltd",
		lines: [
			{
				itemSku: "LAPTOP-DL-001",
				lineNumber: 1,
				quantityOrdered: 5,
				quantityPicked: 5,
				quantityShipped: 5,
				unitPrice: 899.99,
			},
			{
				itemSku: "MONITOR-LG-008",
				lineNumber: 2,
				quantityOrdered: 5,
				quantityPicked: 5,
				quantityShipped: 5,
				unitPrice: 199.99,
			},
		],
		orderDate: "2024-02-10",
		orderNumber: "SO-2024-001",
		shipDate: "2024-02-12",
		status: "SHIPPED",
	},
];

// System settings
const systemSettings = [
	{
		dataType: "STRING",
		description: "Default currency for pricing",
		key: "default_currency",
		value: "GBP",
	},
	{
		dataType: "NUMBER",
		description: "Percentage below min stock to trigger alerts",
		key: "low_stock_threshold_percentage",
		value: 20,
	},
	{
		dataType: "BOOLEAN",
		description: "Enable barcode scanning features",
		key: "enable_barcode_scanning",
		value: true,
	},
	{
		dataType: "BOOLEAN",
		description: "Automatically create stock levels for new items",
		key: "auto_create_stock_locations",
		value: false,
	},
	{
		dataType: "JSON",
		description: "Company information for reports",
		key: "company_info",
		value: { address: "Demo Address", name: "InventoryFlow Demo" },
	},
];

export {
	categories,
	initialStockLevels,
	inventoryItems,
	locations,
	phoneVariants,
	purchaseOrders,
	rolesWithPermissions,
	salesOrders,
	suppliers,
	systemSettings,
	users,
};

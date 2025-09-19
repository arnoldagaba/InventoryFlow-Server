// InventoryFlow Seed Data - Complete Executable Seed Script
// Execute in order to maintain referential integrity

import { env } from "#config/env.js";
import { PrismaClient, SettingDataType, StockTransactionType } from "#generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";

// Enhanced Argon2 configuration for development (reduce in production for performance)
const argon2Config = {
	hashLength: 32, // 32 byte hash length
	memoryCost: 32768, // 32 MB for development (increase to 65536 for production)
	parallelism: 2, // 2 parallel threads
	timeCost: 2, // 2 iterations for development (increase to 3 for production)
	type: argon2.argon2id,
};

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
	return await argon2.hash(password, argon2Config);
}

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Main seeding function
async function main() {
	console.log("🌱 Starting database seeding...");

	try {
		// 1. Create Roles and Permissions
		console.log("📋 Creating roles and permissions...");

		const adminRole = await prisma.role.create({
			data: {
				description: "Full system access",
				name: "Admin",
				permissions: {
					create: [
						{ permission: "USERS_VIEW" },
						{ permission: "USERS_CREATE" },
						{ permission: "USERS_UPDATE" },
						{ permission: "USERS_DELETE" },
						{ permission: "INVENTORY_VIEW" },
						{ permission: "INVENTORY_CREATE" },
						{ permission: "INVENTORY_UPDATE" },
						{ permission: "INVENTORY_DELETE" },
						{ permission: "INVENTORY_ADJUST_STOCK" },
						{ permission: "ORDERS_VIEW" },
						{ permission: "ORDERS_CREATE" },
						{ permission: "ORDERS_UPDATE" },
						{ permission: "ORDERS_DELETE" },
						{ permission: "LOCATIONS_MANAGE" },
						{ permission: "SUPPLIERS_MANAGE" },
						{ permission: "REPORTS_VIEW" },
						{ permission: "AUDIT_VIEW" },
						{ permission: "SETTINGS_MANAGE" },
					],
				},
			},
		});

		const managerRole = await prisma.role.create({
			data: {
				description: "Operations management access",
				name: "Manager",
				permissions: {
					create: [
						{ permission: "USERS_VIEW" },
						{ permission: "INVENTORY_VIEW" },
						{ permission: "INVENTORY_CREATE" },
						{ permission: "INVENTORY_UPDATE" },
						{ permission: "INVENTORY_ADJUST_STOCK" },
						{ permission: "ORDERS_VIEW" },
						{ permission: "ORDERS_CREATE" },
						{ permission: "ORDERS_UPDATE" },
						{ permission: "LOCATIONS_MANAGE" },
						{ permission: "SUPPLIERS_MANAGE" },
						{ permission: "REPORTS_VIEW" },
						{ permission: "AUDIT_VIEW" },
					],
				},
			},
		});

		const operatorRole = await prisma.role.create({
			data: {
				description: "Day-to-day operations",
				name: "Operator",
				permissions: {
					create: [
						{ permission: "INVENTORY_VIEW" },
						{ permission: "INVENTORY_UPDATE" },
						{ permission: "INVENTORY_ADJUST_STOCK" },
						{ permission: "ORDERS_VIEW" },
						{ permission: "ORDERS_UPDATE" },
						{ permission: "REPORTS_VIEW" },
					],
				},
			},
		});

		const viewerRole = await prisma.role.create({
			data: {
				description: "Read-only access",
				name: "Viewer",
				permissions: {
					create: [
						{ permission: "INVENTORY_VIEW" },
						{ permission: "ORDERS_VIEW" },
						{ permission: "REPORTS_VIEW" },
					],
				},
			},
		});

		console.log("✅ Roles and permissions created");

		// 2. Create Users with hashed passwords
		console.log("👥 Creating users...");

		const adminUser = await prisma.user.create({
			data: {
				email: "admin@inventoryflow.com",
				firstName: "System",
				lastName: "Administrator",
				password: await hashPassword("SecureAdmin123!@#"),
				roleId: adminRole.id,
				username: "admin",
			},
		});

		const managerUser = await prisma.user.create({
			data: {
				email: "manager@inventoryflow.com",
				firstName: "Sarah",
				lastName: "Johnson",
				password: await hashPassword("ManagerPass456!@#"),
				roleId: managerRole.id,
				username: "manager",
			},
		});

		const operatorUser = await prisma.user.create({
			data: {
				email: "operator@inventoryflow.com",
				firstName: "Mike",
				lastName: "Wilson",
				password: await hashPassword("OperatorPass789!@#"),
				roleId: operatorRole.id,
				username: "operator",
			},
		});

		console.log("✅ Users created");

		// 3. Create Categories (hierarchical structure)
		console.log("📂 Creating categories...");

		const electronicsCategory = await prisma.category.create({
			data: {
				description: "Electronic devices and components",
				name: "Electronics",
			},
		});

		const computersCategory = await prisma.category.create({
			data: {
				description: "Computing hardware",
				name: "Computers",
				parentId: electronicsCategory.id,
			},
		});

		const laptopsCategory = await prisma.category.create({
			data: {
				description: "Portable computers",
				name: "Laptops",
				parentId: computersCategory.id,
			},
		});

		const desktopsCategory = await prisma.category.create({
			data: {
				description: "Desktop computers",
				name: "Desktops",
				parentId: computersCategory.id,
			},
		});

		const mobileCategory = await prisma.category.create({
			data: {
				description: "Smartphones and tablets",
				name: "Mobile Devices",
				parentId: electronicsCategory.id,
			},
		});

		const officeSuppliesCategory = await prisma.category.create({
			data: {
				description: "General office consumables",
				name: "Office Supplies",
			},
		});

		const stationeryCategory = await prisma.category.create({
			data: {
				description: "Writing materials",
				name: "Stationery",
				parentId: officeSuppliesCategory.id,
			},
		});

		const furnitureCategory = await prisma.category.create({
			data: {
				description: "Office furniture",
				name: "Furniture",
				parentId: officeSuppliesCategory.id,
			},
		});

		console.log("✅ Categories created");

		// 4. Create Locations (warehouse hierarchy)
		console.log("🏢 Creating locations...");

		const mainWarehouse = await prisma.location.create({
			data: {
				code: "WH001",
				name: "Main Warehouse",
				type: "WAREHOUSE",
			},
		});

		const zoneA = await prisma.location.create({
			data: {
				code: "ZONE-A",
				name: "Electronics Zone",
				parentId: mainWarehouse.id,
				type: "ZONE",
			},
		});

		const zoneB = await prisma.location.create({
			data: {
				code: "ZONE-B",
				name: "Office Supplies Zone",
				parentId: mainWarehouse.id,
				type: "ZONE",
			},
		});

		const aisleA1 = await prisma.location.create({
			data: {
				code: "A-01",
				name: "Aisle A1",
				parentId: zoneA.id,
				type: "AISLE",
			},
		});

		const aisleA2 = await prisma.location.create({
			data: {
				code: "A-02",
				name: "Aisle A2",
				parentId: zoneA.id,
				type: "AISLE",
			},
		});

		const aisleB1 = await prisma.location.create({
			data: {
				code: "B-01",
				name: "Aisle B1",
				parentId: zoneB.id,
				type: "AISLE",
			},
		});

		const shelfA1S1 = await prisma.location.create({
			data: {
				code: "A01-S1",
				name: "Shelf 1",
				parentId: aisleA1.id,
				type: "SHELF",
			},
		});

		const shelfA1S2 = await prisma.location.create({
			data: {
				code: "A01-S2",
				name: "Shelf 2",
				parentId: aisleA1.id,
				type: "SHELF",
			},
		});

		const store001 = await prisma.location.create({
			data: {
				code: "STORE001",
				name: "High Street Store",
				type: "STORE",
			},
		});

		console.log("✅ Locations created");

		// 5. Create Suppliers
		console.log("🏭 Creating suppliers...");

		const techCorpSupplier = await prisma.supplier.create({
			data: {
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
		});

		const officeEssentialsSupplier = await prisma.supplier.create({
			data: {
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
		});

		const globalElectronicsSupplier = await prisma.supplier.create({
			data: {
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
		});

		console.log("✅ Suppliers created");

		// 6. Create Inventory Items
		console.log("📦 Creating inventory items...");

		const dellLaptop = await prisma.inventoryItem.create({
			data: {
				barcode: "1234567890123",
				brand: "Dell",
				categoryId: laptopsCategory.id,
				costPrice: 649.99,
				description:
					'15.6" business laptop with Intel Core i5 processor, 8GB RAM, 256GB SSD',
				maxStockLevel: 50,
				minStockLevel: 5,
				model: "Latitude 3520",
				name: "Dell Latitude 3520 Laptop",
				sellingPrice: 899.99,
				sku: "LAPTOP-DL-001",
			},
		});

		const hpLaptop = await prisma.inventoryItem.create({
			data: {
				barcode: "2345678901234",
				brand: "HP",
				categoryId: laptopsCategory.id,
				costPrice: 849.99,
				description: '15.6" professional laptop with Intel Core i7, 16GB RAM, 512GB SSD',
				maxStockLevel: 30,
				minStockLevel: 3,
				model: "ProBook 450 G8",
				name: "HP ProBook 450 G8",
				sellingPrice: 1199.99,
				sku: "LAPTOP-HP-002",
			},
		});

		const dellDesktop = await prisma.inventoryItem.create({
			data: {
				barcode: "3456789012345",
				brand: "Dell",
				categoryId: desktopsCategory.id,
				costPrice: 499.99,
				description: "Compact desktop PC with Intel Core i5, 8GB RAM, 256GB SSD",
				maxStockLevel: 20,
				minStockLevel: 2,
				model: "OptiPlex 3080",
				name: "Dell OptiPlex 3080 Desktop",
				sellingPrice: 749.99,
				sku: "DESKTOP-DL-003",
			},
		});

		const iPhone = await prisma.inventoryItem.create({
			data: {
				barcode: "4567890123456",
				brand: "Apple",
				categoryId: mobileCategory.id,
				costPrice: 629.99,
				description: "128GB smartphone in various colours",
				maxStockLevel: 100,
				minStockLevel: 10,
				model: "iPhone 13",
				name: "Apple iPhone 13",
				sellingPrice: 899.99,
				sku: "MOBILE-APL-004",
			},
		});

		const officeChair = await prisma.inventoryItem.create({
			data: {
				barcode: "5678901234567",
				brand: "ErgoMax",
				categoryId: furnitureCategory.id,
				costPrice: 149.99,
				description: "Adjustable ergonomic office chair with lumbar support",
				maxStockLevel: 25,
				minStockLevel: 5,
				name: "ErgoMax Office Chair",
				sellingPrice: 249.99,
				sku: "CHAIR-ERG-005",
			},
		});

		const ballpointPens = await prisma.inventoryItem.create({
			data: {
				barcode: "6789012345678",
				brand: "WritePro",
				categoryId: stationeryCategory.id,
				costPrice: 4.99,
				description: "Pack of 10 high-quality ballpoint pens",
				maxStockLevel: 200,
				minStockLevel: 20,
				name: "Premium Ballpoint Pens (Black)",
				sellingPrice: 9.99,
				sku: "PEN-BLK-006",
				unitOfMeasure: "pack",
			},
		});

		const copyPaper = await prisma.inventoryItem.create({
			data: {
				barcode: "7890123456789",
				brand: "PaperPro",
				categoryId: stationeryCategory.id,
				costPrice: 3.99,
				description: "80gsm white copy paper, ream of 500 sheets",
				maxStockLevel: 500,
				minStockLevel: 50,
				name: "A4 Copy Paper (500 sheets)",
				sellingPrice: 7.99,
				sku: "PAPER-A4-007",
				unitOfMeasure: "ream",
			},
		});

		const lgMonitor = await prisma.inventoryItem.create({
			data: {
				barcode: "8901234567890",
				brand: "LG",
				categoryId: electronicsCategory.id,
				costPrice: 129.99,
				description: "24-inch LED monitor with 1920x1080 resolution",
				maxStockLevel: 40,
				minStockLevel: 8,
				model: "24MK430H",
				name: 'LG 24" Full HD Monitor',
				sellingPrice: 199.99,
				sku: "MONITOR-LG-008",
			},
		});

		const logitechKeyboard = await prisma.inventoryItem.create({
			data: {
				barcode: "9012345678901",
				brand: "Logitech",
				categoryId: electronicsCategory.id,
				costPrice: 39.99,
				description: "Wireless keyboard with number pad and long battery life",
				maxStockLevel: 75,
				minStockLevel: 15,
				model: "MK540",
				name: "Logitech Wireless Keyboard",
				sellingPrice: 69.99,
				sku: "KEYBOARD-LOG-009",
			},
		});

		const logitechMouse = await prisma.inventoryItem.create({
			data: {
				barcode: "0123456789012",
				brand: "Logitech",
				categoryId: electronicsCategory.id,
				costPrice: 29.99,
				description: "Ergonomic wireless mouse with precision tracking",
				maxStockLevel: 100,
				minStockLevel: 20,
				model: "M705",
				name: "Logitech Wireless Mouse",
				sellingPrice: 49.99,
				sku: "MOUSE-LOG-010",
			},
		});

		console.log("✅ Inventory items created");

		// 7. Create iPhone Variants
		console.log("📱 Creating product variants...");

		const iPhoneBlack = await prisma.inventoryVariant.create({
			data: {
				attributes: { colour: "Black", storage: "128GB" },
				barcode: "4567890123457",
				costPrice: 629.99,
				parentItemId: iPhone.id,
				sellingPrice: 899.99,
				sku: "MOBILE-APL-004-BLK",
			},
		});

		const iPhoneWhite = await prisma.inventoryVariant.create({
			data: {
				attributes: { colour: "White", storage: "128GB" },
				barcode: "4567890123458",
				costPrice: 629.99,
				parentItemId: iPhone.id,
				sellingPrice: 899.99,
				sku: "MOBILE-APL-004-WHT",
			},
		});

		const iPhoneBlue = await prisma.inventoryVariant.create({
			data: {
				attributes: { colour: "Blue", storage: "128GB" },
				barcode: "4567890123459",
				costPrice: 629.99,
				parentItemId: iPhone.id,
				sellingPrice: 899.99,
				sku: "MOBILE-APL-004-BLU",
			},
		});

		console.log("✅ Product variants created");

		// 8. Create Stock Levels
		console.log("📊 Creating stock levels...");

		const stockLevels = [
			// Main warehouse stock
			{
				itemId: dellLaptop.id,
				locationId: shelfA1S1.id,
				quantityOnHand: 25,
				quantityReserved: 2,
			},
			{
				itemId: hpLaptop.id,
				locationId: shelfA1S1.id,
				quantityOnHand: 15,
				quantityReserved: 1,
			},
			{
				itemId: dellDesktop.id,
				locationId: shelfA1S2.id,
				quantityOnHand: 12,
				quantityReserved: 0,
			},
			{
				itemId: officeChair.id,
				locationId: aisleB1.id,
				quantityOnHand: 18,
				quantityReserved: 3,
			},
			{
				itemId: ballpointPens.id,
				locationId: aisleB1.id,
				quantityOnHand: 150,
				quantityReserved: 10,
			},
			{
				itemId: copyPaper.id,
				locationId: aisleB1.id,
				quantityOnHand: 200,
				quantityReserved: 25,
			},
			{
				itemId: lgMonitor.id,
				locationId: aisleA2.id,
				quantityOnHand: 30,
				quantityReserved: 2,
			},
			{
				itemId: logitechKeyboard.id,
				locationId: aisleA2.id,
				quantityOnHand: 45,
				quantityReserved: 5,
			},
			{
				itemId: logitechMouse.id,
				locationId: aisleA2.id,
				quantityOnHand: 75,
				quantityReserved: 8,
			},

			// Store stock
			{
				itemId: dellLaptop.id,
				locationId: store001.id,
				quantityOnHand: 3,
				quantityReserved: 1,
			},
			{
				itemId: lgMonitor.id,
				locationId: store001.id,
				quantityOnHand: 5,
				quantityReserved: 0,
			},
			{
				itemId: logitechKeyboard.id,
				locationId: store001.id,
				quantityOnHand: 8,
				quantityReserved: 1,
			},
		];

		for (const stock of stockLevels) {
			await prisma.stockLevel.create({
				data: {
					...stock,
					lastCountedAt: new Date(),
					quantityAvailable: stock.quantityOnHand - stock.quantityReserved,
				},
			});
		}

		// Variant stock levels
		const variantStockLevels = [
			{
				locationId: shelfA1S1.id,
				quantityOnHand: 12,
				quantityReserved: 2,
				variantId: iPhoneBlack.id,
			},
			{
				locationId: shelfA1S1.id,
				quantityOnHand: 8,
				quantityReserved: 1,
				variantId: iPhoneWhite.id,
			},
			{
				locationId: shelfA1S1.id,
				quantityOnHand: 15,
				quantityReserved: 3,
				variantId: iPhoneBlue.id,
			},
		];

		for (const stock of variantStockLevels) {
			await prisma.stockLevel.create({
				data: {
					...stock,
					lastCountedAt: new Date(),
					quantityAvailable: stock.quantityOnHand - stock.quantityReserved,
				},
			});
		}

		console.log("✅ Stock levels created");

		// 9. Create Purchase Orders
		console.log("🛒 Creating purchase orders...");

		const purchaseOrder1 = await prisma.purchaseOrder.create({
			data: {
				createdById: adminUser.id,
				lines: {
					create: [
						{
							itemId: dellLaptop.id,
							lineNumber: 1,
							lineTotal: 12999.8,
							quantityOrdered: 20,
							quantityReceived: 20,
							unitPrice: 649.99,
						},
						{
							itemId: dellDesktop.id,
							lineNumber: 2,
							lineTotal: 4999.9,
							quantityOrdered: 10,
							quantityReceived: 10,
							unitPrice: 499.99,
						},
					],
				},
				orderDate: new Date("2024-01-15"),
				orderNumber: "PO-2024-001",
				receivedDate: new Date("2024-01-22"),
				status: "RECEIVED",
				supplierId: techCorpSupplier.id,
				totalAmount: 14999.7,
			},
		});

		const purchaseOrder2 = await prisma.purchaseOrder.create({
			data: {
				createdById: managerUser.id,
				lines: {
					create: [
						{
							itemId: officeChair.id,
							lineNumber: 1,
							lineTotal: 2249.85,
							quantityOrdered: 15,
							quantityReceived: 12,
							unitPrice: 149.99,
						},
						{
							itemId: ballpointPens.id,
							lineNumber: 2,
							lineTotal: 499.0,
							quantityOrdered: 100,
							quantityReceived: 100,
							unitPrice: 4.99,
						},
					],
				},
				orderDate: new Date("2024-02-01"),
				orderNumber: "PO-2024-002",
				status: "PARTIALLY_RECEIVED",
				supplierId: officeEssentialsSupplier.id,
				totalAmount: 2749.85,
			},
		});

		console.log("✅ Purchase orders created");

		// 10. Create Sales Orders
		console.log("🛍️ Creating sales orders...");

		const salesOrder1 = await prisma.salesOrder.create({
			data: {
				createdById: operatorUser.id,
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
				lines: {
					create: [
						{
							itemId: dellLaptop.id,
							lineNumber: 1,
							lineTotal: 4499.95,
							quantityOrdered: 5,
							quantityPicked: 5,
							quantityShipped: 5,
							unitPrice: 899.99,
						},
						{
							itemId: lgMonitor.id,
							lineNumber: 2,
							lineTotal: 999.95,
							quantityOrdered: 5,
							quantityPicked: 5,
							quantityShipped: 5,
							unitPrice: 199.99,
						},
					],
				},
				orderDate: new Date("2024-02-10"),
				orderNumber: "SO-2024-001",
				shipDate: new Date("2024-02-12"),
				status: "SHIPPED",
				totalAmount: 5499.9,
			},
		});

		console.log("✅ Sales orders created");

		// 11. Create System Settings
		console.log("⚙️ Creating system settings...");

		const systemSettings = [
			{
				dataType: "STRING" as const,
				description: "Default currency for pricing",
				key: "default_currency",
				value: "GBP",
			},
			{
				dataType: "NUMBER" as const,
				description: "Percentage below min stock to trigger alerts",
				key: "low_stock_threshold_percentage",
				value: 20,
			},
			{
				dataType: "BOOLEAN" as const,
				description: "Enable barcode scanning features",
				key: "enable_barcode_scanning",
				value: true,
			},
			{
				dataType: "BOOLEAN" as const,
				description: "Automatically create stock levels for new items",
				key: "auto_create_stock_locations",
				value: false,
			},
			{
				dataType: "JSON" as const,
				description: "Company information for reports",
				key: "company_info",
				value: { address: "Demo Address", name: "InventoryFlow Demo" },
			},
		];

		for (const setting of systemSettings) {
			await prisma.setting.create({
				data: {
					...setting,
					dataType: setting.dataType as SettingDataType,
				},
			});
		}

		console.log("✅ System settings created");

		// 12. Create some sample stock transactions
		console.log("📈 Creating stock transactions...");

		const sampleTransactions = [
			{
				cost: 649.99,
				itemId: dellLaptop.id,
				locationId: shelfA1S1.id,
				quantity: 20,
				reason: "Initial stock from PO-2024-001",
				reference: "PO-2024-001",
				type: "PURCHASE" as const,
				userId: adminUser.id,
			},
			{
				cost: 649.99,
				itemId: dellLaptop.id,
				locationId: shelfA1S1.id,
				quantity: -5,
				reason: "Sale to ABC Corporation",
				reference: "SO-2024-001",
				type: "SALE" as const,
				userId: operatorUser.id,
			},
			{
				cost: 129.99,
				itemId: lgMonitor.id,
				locationId: aisleA2.id,
				quantity: 2,
				reason: "Stock count correction",
				type: "ADJUSTMENT" as const,
				userId: managerUser.id,
			},
		];

		for (const transaction of sampleTransactions) {
			await prisma.stockTransaction.create({
				data: {
					...transaction,
					type: transaction.type as StockTransactionType,
				},
			});
		}

		console.log("✅ Stock transactions created");

		// 13. Create some audit logs
		console.log("📋 Creating audit logs...");

		const auditLogs = [
			{
				action: "LOGIN" as const,
				entityId: adminUser.id,
				entityType: "User",
				ipAddress: "192.168.1.100",
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				userId: adminUser.id,
			},
			{
				action: "CREATE" as const,
				entityId: dellLaptop.id,
				entityType: "InventoryItem",
				ipAddress: "192.168.1.100",
				newValues: { name: "Dell Latitude 3520 Laptop", sku: "LAPTOP-DL-001" },
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				userId: adminUser.id,
			},
			{
				action: "STOCK_ADJUSTMENT" as const,
				entityId: lgMonitor.id,
				entityType: "StockLevel",
				ipAddress: "192.168.1.101",
				newValues: { quantity: 30 },
				oldValues: { quantity: 28 },
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				userId: managerUser.id,
			},
		];

		for (const log of auditLogs) {
			await prisma.auditLog.create({
				data: log,
			});
		}

		console.log("✅ Audit logs created");

		console.log("🎉 Database seeding completed successfully!");
		console.log("\n📊 Summary:");
		console.log(`- ${String(await prisma.role.count())} roles created`);
		console.log(`- ${String(await prisma.user.count())} users created`);
		console.log(`- ${String(await prisma.category.count())} categories created`);
		console.log(`- ${String(await prisma.location.count())} locations created`);
		console.log(`- ${String(await prisma.supplier.count())} suppliers created`);
		console.log(`- ${String(await prisma.inventoryItem.count())} inventory items created`);
		console.log(`- ${String(await prisma.inventoryVariant.count())} product variants created`);
		console.log(`- ${String(await prisma.stockLevel.count())} stock levels created`);
		console.log(`- ${String(await prisma.purchaseOrder.count())} purchase orders created`);
		console.log(`- ${String(await prisma.salesOrder.count())} sales orders created`);
		console.log(
			`- ${String(await prisma.stockTransaction.count())} stock transactions created`
		);
		console.log(`- ${String(await prisma.auditLog.count())} audit logs created`);
		console.log(`- ${String(await prisma.setting.count())} system settings created`);

		console.log("\n👥 Default Users Created:");
		console.log("Email: admin@inventoryflow.com | Password: SecureAdmin123!@# | Role: Admin");
		console.log(
			"Email: manager@inventoryflow.com | Password: ManagerPass456!@# | Role: Manager"
		);
		console.log(
			"Email: operator@inventoryflow.com | Password: OperatorPass789!@# | Role: Operator"
		);

		console.log("\n🔐 Security Notes:");
		console.log("- All passwords are hashed using Argon2id");
		console.log("- Change default passwords in production");
		console.log("- Review and adjust Argon2 parameters for production use");
	} catch (error) {
		console.error("❌ Error during seeding:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

// Execute the seeding function
main()
	.then(() => {
		console.log("✅ Seeding process completed");
		process.exit(0);
	})
	.catch(async (error: unknown) => {
		console.error("❌ Seeding process failed:", error);
		await prisma.$disconnect();
		process.exit(1);
	});

// InventoryFlow Seed Data
// Execute in order to maintain referential integrity

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

// 2. Users (passwords will be hashed with Argon2)
const users = [
	{
		email: "admin@inventoryflow.com",
		firstName: "System",
		lastName: "Administrator",
		password: "SecureAdmin123!@#", // Strong password for demo
		roleName: "Admin",
		username: "admin",
	},
	{
		email: "manager@inventoryflow.com",
		firstName: "Sarah",
		lastName: "Johnson",
		password: "ManagerPass456!@#", // Strong password for demo
		roleName: "Manager",
		username: "manager",
	},
	{
		email: "operator@inventoryflow.com",
		firstName: "Mike",
		lastName: "Wilson",
		password: "OperatorPass789!@#", // Strong password for demo
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

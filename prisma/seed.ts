import { env } from "#config/env.js";
import { AuditAction, PrismaClient, SettingDataType } from "#generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";

const argon2Config = {
	hashLength: 32,
	memoryCost: env.NODE_ENV === "development" ? 32768 : 65536,
	parallelism: 2,
	timeCost: env.NODE_ENV === "development" ? 2 : 3,
	type: argon2.argon2id,
};

async function hashPassword(password: string): Promise<string> {
	return await argon2.hash(password, argon2Config);
}

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log("🌱 Starting database seeding...");

	try {
		// 1. Create Roles and Permissions
		console.log("📋 Creating roles and permissions...");

		const [adminRole, managerRole, operatorRole, viewerRole] = await Promise.all([
			prisma.role.create({
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
			}),
			prisma.role.create({
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
			}),
			prisma.role.create({
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
			}),
			prisma.role.create({
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
			}),
		]);

		// 2. Create Users
		console.log("👥 Creating users...");

		const [adminUser, managerUser, operatorUser, viewerUser] = await Promise.all([
			prisma.user.create({
				data: {
					email: "admin@inventoryflow.com",
					firstName: "System",
					lastName: "Administrator",
					password: await hashPassword("SecureAdmin123!@#"),
					roleId: adminRole.id,
					username: "admin",
				},
			}),
			prisma.user.create({
				data: {
					email: "manager@inventoryflow.com",
					firstName: "Sarah",
					lastName: "Johnson",
					password: await hashPassword("ManagerPass456!@#"),
					roleId: managerRole.id,
					username: "manager",
				},
			}),
			prisma.user.create({
				data: {
					email: "operator@inventoryflow.com",
					firstName: "Mike",
					lastName: "Wilson",
					password: await hashPassword("OperatorPass789!@#"),
					roleId: operatorRole.id,
					username: "operator",
				},
			}),
			prisma.user.create({
				data: {
					email: "viewer@inventoryflow.com",
					firstName: "John",
					lastName: "Viewer",
					password: await hashPassword("ViewerPass123!@#"),
					roleId: viewerRole.id,
					username: "viewer",
				},
			}),
		]);

		// 3. Create Categories
		console.log("📂 Creating categories...");

		const electronicsCategory = await prisma.category.create({
			data: {
				description: "Electronic devices and components",
				name: "Electronics",
			},
		});

		const officeSuppliesCategory = await prisma.category.create({
			data: {
				description: "General office consumables",
				name: "Office Supplies",
			},
		});

		const [computersCategory, mobileCategory, stationeryCategory, furnitureCategory] =
			await Promise.all([
				prisma.category.create({
					data: {
						description: "Computing hardware",
						name: "Computers",
						parentId: electronicsCategory.id,
					},
				}),
				prisma.category.create({
					data: {
						description: "Smartphones and tablets",
						name: "Mobile Devices",
						parentId: electronicsCategory.id,
					},
				}),
				prisma.category.create({
					data: {
						description: "Writing materials",
						name: "Stationery",
						parentId: officeSuppliesCategory.id,
					},
				}),
				prisma.category.create({
					data: {
						description: "Office furniture",
						name: "Furniture",
						parentId: officeSuppliesCategory.id,
					},
				}),
			]);

		const [laptopsCategory, desktopsCategory] = await Promise.all([
			prisma.category.create({
				data: {
					description: "Portable computers",
					name: "Laptops",
					parentId: computersCategory.id,
				},
			}),
			prisma.category.create({
				data: {
					description: "Desktop computers",
					name: "Desktops",
					parentId: computersCategory.id,
				},
			}),
		]);

		// 4. Create Locations
		console.log("🏢 Creating locations...");

		const mainWarehouse = await prisma.location.create({
			data: {
				code: "WH001",
				name: "Main Warehouse",
				type: "WAREHOUSE",
			},
		});

		const store001 = await prisma.location.create({
			data: {
				code: "STORE001",
				name: "High Street Store",
				type: "STORE",
			},
		});

		const [zoneA, zoneB] = await Promise.all([
			prisma.location.create({
				data: {
					code: "ZONE-A",
					name: "Electronics Zone",
					parentId: mainWarehouse.id,
					type: "ZONE",
				},
			}),
			prisma.location.create({
				data: {
					code: "ZONE-B",
					name: "Office Supplies Zone",
					parentId: mainWarehouse.id,
					type: "ZONE",
				},
			}),
		]);

		const [aisleA1, aisleA2, aisleB1] = await Promise.all([
			prisma.location.create({
				data: {
					code: "A-01",
					name: "Aisle A1",
					parentId: zoneA.id,
					type: "AISLE",
				},
			}),
			prisma.location.create({
				data: {
					code: "A-02",
					name: "Aisle A2",
					parentId: zoneA.id,
					type: "AISLE",
				},
			}),
			prisma.location.create({
				data: {
					code: "B-01",
					name: "Aisle B1",
					parentId: zoneB.id,
					type: "AISLE",
				},
			}),
		]);

		const [shelfA1S1, shelfA1S2] = await Promise.all([
			prisma.location.create({
				data: {
					code: "A01-S1",
					name: "Shelf 1",
					parentId: aisleA1.id,
					type: "SHELF",
				},
			}),
			prisma.location.create({
				data: {
					code: "A01-S2",
					name: "Shelf 2",
					parentId: aisleA1.id,
					type: "SHELF",
				},
			}),
		]);

		// 5. Create Suppliers
		console.log("🏭 Creating suppliers...");

		const [techCorpSupplier, officeEssentialsSupplier, globalElectronicsSupplier] =
			await Promise.all([
				prisma.supplier.create({
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
				}),
				prisma.supplier.create({
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
				}),
				prisma.supplier.create({
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
				}),
			]);

		// 6. Create Inventory Items
		console.log("📦 Creating inventory items...");

		const inventoryItems = await Promise.all([
			prisma.inventoryItem.create({
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
			}),
			prisma.inventoryItem.create({
				data: {
					barcode: "2345678901234",
					brand: "HP",
					categoryId: laptopsCategory.id,
					costPrice: 849.99,
					description:
						'15.6" professional laptop with Intel Core i7, 16GB RAM, 512GB SSD',
					maxStockLevel: 30,
					minStockLevel: 3,
					model: "ProBook 450 G8",
					name: "HP ProBook 450 G8",
					sellingPrice: 1199.99,
					sku: "LAPTOP-HP-002",
				},
			}),
			prisma.inventoryItem.create({
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
			}),
			prisma.inventoryItem.create({
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
			}),
			prisma.inventoryItem.create({
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
			}),
			prisma.inventoryItem.create({
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
			}),
			prisma.inventoryItem.create({
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
			}),
			prisma.inventoryItem.create({
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
			}),
		]);

		const [
			dellLaptop,
			hpLaptop,
			dellDesktop,
			iPhone,
			officeChair,
			ballpointPens,
			copyPaper,
			lgMonitor,
		] = inventoryItems;

		// 7. Create iPhone Variants
		console.log("📱 Creating product variants...");

		const [iPhoneBlack, iPhoneWhite, iPhoneBlue] = await Promise.all([
			prisma.inventoryVariant.create({
				data: {
					attributes: { colour: "Black", storage: "128GB" },
					barcode: "4567890123457",
					costPrice: 629.99,
					parentItemId: iPhone.id,
					sellingPrice: 899.99,
					sku: "MOBILE-APL-004-BLK",
				},
			}),
			prisma.inventoryVariant.create({
				data: {
					attributes: { colour: "White", storage: "128GB" },
					barcode: "4567890123458",
					costPrice: 629.99,
					parentItemId: iPhone.id,
					sellingPrice: 899.99,
					sku: "MOBILE-APL-004-WHT",
				},
			}),
			prisma.inventoryVariant.create({
				data: {
					attributes: { colour: "Blue", storage: "128GB" },
					barcode: "4567890123459",
					costPrice: 629.99,
					parentItemId: iPhone.id,
					sellingPrice: 899.99,
					sku: "MOBILE-APL-004-BLU",
				},
			}),
		]);

		// 8. Create Purchase Orders with proper totals
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
				totalAmount: 17999.7,
			},
		});

		// 9. Create Stock Transactions for Purchase Order
		console.log("📈 Creating stock transactions...");

		await Promise.all([
			prisma.stockTransaction.create({
				data: {
					cost: 649.99,
					itemId: dellLaptop.id,
					locationId: shelfA1S1.id,
					quantity: 20,
					reason: "Initial stock from PO-2024-001",
					reference: "PO-2024-001",
					type: "PURCHASE",
					userId: adminUser.id,
				},
			}),
			prisma.stockTransaction.create({
				data: {
					cost: 499.99,
					itemId: dellDesktop.id,
					locationId: shelfA1S2.id,
					quantity: 10,
					reason: "Initial stock from PO-2024-001",
					reference: "PO-2024-001",
					type: "PURCHASE",
					userId: adminUser.id,
				},
			}),
			prisma.stockTransaction.create({
				data: {
					cost: 149.99,
					itemId: officeChair.id,
					locationId: aisleB1.id,
					quantity: 7,
					reason: "Office chairs initial stock",
					reference: "INITIAL-STOCK",
					type: "PURCHASE",
					userId: managerUser.id,
				},
			}),
			prisma.stockTransaction.create({
				data: {
					cost: 4.99,
					itemId: ballpointPens.id,
					locationId: aisleB1.id,
					quantity: 50,
					reason: "Pens initial stock",
					reference: "INITIAL-STOCK",
					type: "PURCHASE",
					userId: managerUser.id,
				},
			}),
			prisma.stockTransaction.create({
				data: {
					cost: 3.99,
					itemId: copyPaper.id,
					locationId: aisleB1.id,
					quantity: 100,
					reason: "Paper initial stock",
					reference: "INITIAL-STOCK",
					type: "PURCHASE",
					userId: managerUser.id,
				},
			}),
			prisma.stockTransaction.create({
				data: {
					cost: 129.99,
					itemId: lgMonitor.id,
					locationId: aisleA2.id,
					quantity: 5,
					reason: "Monitor initial stock",
					reference: "INITIAL-STOCK",
					type: "PURCHASE",
					userId: adminUser.id,
				},
			}),
			prisma.stockTransaction.create({
				data: {
					cost: 629.99,
					locationId: aisleA2.id,
					quantity: 15,
					reason: "iPhone Blue initial stock",
					reference: "INITIAL-STOCK",
					type: "PURCHASE",
					userId: adminUser.id,
					variantId: iPhoneBlue.id,
				},
			}),
			prisma.stockTransaction.create({
				data: {
					cost: 849.99,
					itemId: hpLaptop.id,
					locationId: store001.id,
					quantity: 3,
					reason: "HP laptop initial stock",
					reference: "INITIAL-STOCK",
					type: "PURCHASE",
					userId: adminUser.id,
				},
			}),
		]);

		// 10. Create Stock Levels matching transactions
		console.log("📊 Creating stock levels...");

		await Promise.all([
			prisma.stockLevel.create({
				data: {
					itemId: dellLaptop.id,
					lastCountedAt: new Date(),
					locationId: shelfA1S1.id,
					quantityAvailable: 20,
					quantityOnHand: 20,
					quantityReserved: 0,
				},
			}),
			prisma.stockLevel.create({
				data: {
					itemId: dellDesktop.id,
					lastCountedAt: new Date(),
					locationId: shelfA1S2.id,
					quantityAvailable: 10,
					quantityOnHand: 10,
					quantityReserved: 0,
				},
			}),
			prisma.stockLevel.create({
				data: {
					lastCountedAt: new Date(),
					locationId: shelfA1S1.id,
					quantityAvailable: 10,
					quantityOnHand: 12,
					quantityReserved: 2,
					variantId: iPhoneBlack.id,
				},
			}),
			prisma.stockLevel.create({
				data: {
					lastCountedAt: new Date(),
					locationId: shelfA1S1.id,
					quantityAvailable: 7,
					quantityOnHand: 8,
					quantityReserved: 1,
					variantId: iPhoneWhite.id,
				},
			}),
		]);

		// 11. Create Sales Order
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
					],
				},
				orderDate: new Date("2024-02-10"),
				orderNumber: "SO-2024-001",
				shipDate: new Date("2024-02-12"),
				status: "SHIPPED",
				totalAmount: 4499.95,
			},
		});

		// 12. Create Stock Transaction for Sale
		await prisma.stockTransaction.create({
			data: {
				cost: 649.99,
				itemId: dellLaptop.id,
				locationId: shelfA1S1.id,
				quantity: -5,
				reason: "Sale to ABC Corporation",
				reference: "SO-2024-001",
				type: "SALE",
				userId: operatorUser.id,
			},
		});

		// 13. Update Stock Level after sale
		await prisma.stockLevel.update({
			data: {
				quantityAvailable: 15,
				quantityOnHand: 15,
			},
			where: {
				itemId_locationId: {
					itemId: dellLaptop.id,
					locationId: shelfA1S1.id,
				},
			},
		});

		// 14. Create System Settings
		console.log("⚙️ Creating system settings...");

		await prisma.setting.createMany({
			data: [
				{
					dataType: SettingDataType.STRING,
					description: "Default currency for pricing",
					key: "default_currency",
					value: "GBP",
				},
				{
					dataType: SettingDataType.NUMBER,
					description: "Percentage below min stock to trigger alerts",
					key: "low_stock_threshold_percentage",
					value: 20,
				},
				{
					dataType: SettingDataType.BOOLEAN,
					description: "Enable barcode scanning features",
					key: "enable_barcode_scanning",
					value: true,
				},
				{
					dataType: SettingDataType.JSON,
					description: "Company information for reports",
					key: "company_info",
					value: { address: "Demo Address", name: "InventoryFlow Demo" },
				},
			],
		});

		// 15. Create Audit Logs
		console.log("📋 Creating audit logs...");

		await prisma.auditLog.createMany({
			data: [
				{
					action: AuditAction.LOGIN,
					entityId: adminUser.id,
					entityType: "User",
					ipAddress: "192.168.1.100",
					userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
					userId: adminUser.id,
				},
				{
					action: AuditAction.CREATE,
					entityId: dellLaptop.id,
					entityType: "InventoryItem",
					ipAddress: "192.168.1.100",
					newValues: { name: "Dell Latitude 3520 Laptop", sku: "LAPTOP-DL-001" },
					userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
					userId: adminUser.id,
				},
				{
					action: AuditAction.CREATE,
					entityId: purchaseOrder1.id,
					entityType: "PurchaseOrder",
					ipAddress: "192.168.1.101",
					newValues: { orderNumber: "PO-2024-001", supplierId: techCorpSupplier.id },
					userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
					userId: adminUser.id,
				},
				{
					action: AuditAction.CREATE,
					entityId: officeEssentialsSupplier.id,
					entityType: "Supplier",
					ipAddress: "192.168.1.104",
					newValues: { code: "SUPP002", name: "Office Essentials UK" },
					userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
					userId: managerUser.id,
				},
				{
					action: AuditAction.CREATE,
					entityId: globalElectronicsSupplier.id,
					entityType: "Supplier",
					ipAddress: "192.168.1.105",
					newValues: { code: "SUPP003", name: "Global Electronics Supply" },
					userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
					userId: adminUser.id,
				},
				{
					action: AuditAction.CREATE,
					entityId: salesOrder1.id,
					entityType: "SalesOrder",
					ipAddress: "192.168.1.102",
					newValues: { customerName: "ABC Corporation Ltd", orderNumber: "SO-2024-001" },
					userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
					userId: operatorUser.id,
				},
				{
					action: AuditAction.LOGIN,
					entityId: viewerUser.id,
					entityType: "User",
					ipAddress: "192.168.1.103",
					userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
					userId: viewerUser.id,
				},
			],
		});

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
		console.log("Email: admin@inventoryflow.com | Username: admin | Role: Admin");
		console.log("Email: manager@inventoryflow.com | Username: manager | Role: Manager");
		console.log("Email: operator@inventoryflow.com | Username: operator | Role: Operator");
		console.log("Email: viewer@inventoryflow.com | Username: viewer | Role: Viewer");
	} catch (error) {
		console.error("❌ Error during seeding:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

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

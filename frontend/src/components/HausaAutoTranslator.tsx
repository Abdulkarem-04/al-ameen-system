import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

const FULL_HAUSA_MAP: Record<string, string> = {
  // Navigation & Headers
  Dashboard: 'Dashbod',
  'Executive Dashboard': 'Dashbod na Gudanarwa',
  'Provision Store Overview': 'Bayyani na Shagon Kaya',
  'POS Banking Overview': 'Bayyani na Bankin POS',
  'Laundry Service Overview': 'Bayyani na Sabis na Wanki',
  'Products Master': 'Babban Jerin Kayayyaki',
  'Inventory Status': 'Matsayin Ajiyar Kaya',
  'Supplier Purchases': 'Siyayyar Kaya (Restock)',
  'Customers & Debt': 'Kwastamomi da Bashi',
  'Customer Credit Ledger': 'Littafin Bashin Kwastamomi',
  'Sales History & Refunds': 'Tarihin Sayarwa da Mayarwa',
  'Store Expenses': 'Kashe Kuɗin Shago',
  'Stock & Expiry Tools': 'Kaya da Ƙarewar Lokaci',
  'Provision Store Reports': 'Rahotannin Shagon Kaya',
  'POS Banking Transactions': "Mu'amalolin Bankin POS",
  'Cash & Float Management': 'Gudanar da Kuɗi da Float',
  'Repeat POS Customers': 'Kwastamomin POS na Yau da Kullum',
  'POS Banking Expenses': 'Kashe Kuɗin Bankin POS',
  'Banking Settings': 'Saitunan Bankin POS',
  'POS Banking Reports': 'Rahotannin Bankin POS',
  'Laundry Orders & Intake': 'Ododin Wanki da Karɓa',
  'Laundry Customers': 'Kwastamomin Wanki',
  'Laundry Payment Ledger': 'Littafin Biyan Kuɗin Wanki',
  'Laundry Expenses': 'Kashe Kuɗin Wanki',
  'Laundry Garment Price List': 'Farashin Tufafin Wanki',
  'Laundry Service Reports': 'Rahotannin Sabis na Wanki',
  'Staff & PIN Management': "Gudanar da Ma'aikata da PIN",
  'Roles & Permissions Matrix': 'Matsayi da Izini (V/A/E/D)',
  'System Audit Log': 'Littafin Binciken Tsari',
  'Shop Settings & Branding': 'Saitunan Shago da Logo',

  // Common Buttons & Actions
  Save: 'Ajiye',
  'Save Product': 'Ajiye Kaya',
  'Update Product': 'Sabunta Kaya',
  'Save Transaction': "Ajiye Mu'amala",
  'Save Drop-Off Order': 'Ajiye Odar Wanki',
  'Save Settings': 'Ajiye Saituna',
  'Save Changes': 'Ajiye Canje-canje',
  Cancel: 'Soke',
  Close: 'Rufe',
  Clear: 'Goge',
  Refresh: 'Sabunta',
  'Refresh Balances': 'Sabunta Lissafi',
  Checkout: 'Kammala Biya',
  'Complete Sale': 'Kammala Sayarwa',
  'Confirm Refund': 'Tabbatar da Mayarwa',
  'Print Receipt': 'Buga Rasit',
  'Print Tag': 'Buga Takardar Wanki',
  Reprint: 'Sake Buga',
  Refund: 'Mayar da Kuɗi',
  Manage: 'Gudanar',
  Edit: 'Gyara',
  Delete: 'Share',
  Deactivate: 'Tsayar',
  Activate: 'Kunna',
  'Record Payment': 'Yi Rikodin Biya',
  'Confirm Payment': 'Tabbatar da Biya',
  'Apply Adjustment': 'Aiwatar da Gyara',
  'Add Expiry Batch': 'Ƙara Batch na Ƙarewa',
  'Open Banking Day': 'Buɗe Ranar Banki',
  'Close Banking Day': 'Rufe Ranar Banki',
  'Open Provision Store': 'Buɗe Shagon Kaya',
  'Open POS Banking': 'Buɗe Bankin POS',
  'Open Laundry Service': 'Buɗe Sabis na Wanki',
  'Export Sales CSV': 'Fitar da CSV na Sayarwa',
  'Export Transactions CSV': "Fitar da CSV na Mu'amaloli",
  'Export Orders CSV': 'Fitar da CSV na Ododi',
  '+ Add New Product': '+ Ƙara Sabon Kaya',
  '+ Add Customer': '+ Ƙara Kwastama',
  '+ Add Staff': "+ Ƙara Ma'aikaci",

  // Table Headers & Labels
  Code: 'Lamba',
  'Product Name': 'Sunan Kaya',
  'Customer Name': 'Sunan Kwastama',
  Customer: 'Kwastama',
  Phone: 'Waya',
  Unit: 'Rukuni',
  Stock: 'Kaya a Ajiye',
  Status: 'Matsayi',
  Actions: 'Aiki',
  Action: 'Aiki',
  Date: 'Rana',
  'Date & Time': 'Rana da Lokaci',
  Invoice: 'Lambar Invoice',
  Amount: 'Adadi',
  Total: 'Jimla',
  'Total Amount': 'Jimlar Kuɗi',
  Balance: 'Ragowar Bashi',
  'Outstanding Balance': 'Bashin da Ake Bi',
  'Payment Method': 'Hanyar Biya',
  Category: 'Rukuni',
  Description: 'Bayani',
  'Recorded By': 'Wanda Ya Rubuta',
  Employee: "Ma'aikaci",
  Role: 'Matsayi',
  Who: 'Wanda Ya Yi',
  Details: 'Cikakken Bayani',
  'Out of Stock': 'Ya Ƙare',
  'Low Stock': 'Ƙarancin Kaya',
  'In Stock': 'A Ajiye',
  Today: 'Yau',
  'This Week': 'Wannan Mako',
  'This Month': 'Wannan Wata',
  'All Time': 'Duk Lokaci',
  Revenue: 'Kuɗin Shiga',
  Expenses: 'Kashe Kuɗi',
  'Net Profit': 'Ribar da Ta Rage',
  'Sales Today': 'Sayarwar Yau',
  'Profit Today': 'Ribar Yau',
  'Total Products': 'Jimlar Kayayyaki',
  'Physical Drawer Cash': 'Kuɗin Drawer a Hannu',
  'Current Order': 'Kayan Cikin Kwando',
  'Cart is empty': 'Kwando babu komai',
};

const originals = new WeakMap<Node, string>();

export default function HausaAutoTranslator() {
  const lang = useAuthStore((s) => s.lang);

  useEffect(() => {
    let isApplying = false;

    const translateDOM = () => {
      if (isApplying || !document.body) return;
      isApplying = true;
      try {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
        );
        const textNodes: Text[] = [];
        while (walker.nextNode()) {
          textNodes.push(walker.currentNode as Text);
        }

        for (const node of textNodes) {
          const parentTag = node.parentElement?.tagName;
          if (parentTag === 'SCRIPT' || parentTag === 'STYLE') continue;
          const raw = node.nodeValue || '';
          const trimmed = raw.trim();
          if (!trimmed) continue;

          const orig = originals.has(node) ? originals.get(node)! : raw;
          const origTrimmed = orig.trim();

          if (lang === 'ha') {
            if (FULL_HAUSA_MAP[origTrimmed]) {
              if (!originals.has(node)) originals.set(node, orig);
              node.nodeValue = orig.replace(
                origTrimmed,
                FULL_HAUSA_MAP[origTrimmed],
              );
            }
          } else if (originals.has(node)) {
            node.nodeValue = originals.get(node)!;
          }
        }
      } finally {
        isApplying = false;
      }
    };

    translateDOM();

    const observer = new MutationObserver(() => {
      if (!isApplying) translateDOM();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [lang]);

  return null;
}

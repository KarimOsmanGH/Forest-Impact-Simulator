/**
 * PDF Export utility for forest impact reports
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExportData } from './exportUtils';

export async function generatePDFReport(data: ExportData): Promise<void> {
  const doc = new jsPDF();
  
  // Colors
  const primaryColor: [number, number, number] = [27, 77, 62]; // #1B4D3E
  const lightGreen: [number, number, number] = [232, 237, 235]; // bg-primary/10
  
  let yPos = 20;
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Forest Impact Analysis', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Environmental Impact Simulation Report', 105, 30, { align: 'center' });
  
  yPos = 50;
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Metadata Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Report Information', 14, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const metadataInfo = [
    ['Generated', new Date(data.metadata.timestamp).toLocaleString()],
    ['Version', data.metadata.simulatorVersion],
    ['Simulation Years', data.metadata.simulation?.years?.toString() || 'N/A'],
  ];
  
  if (data.metadata.location?.latitude && data.metadata.location?.longitude) {
    metadataInfo.push([
      'Location',
      `${data.metadata.location.latitude.toFixed(4)}°, ${data.metadata.location.longitude.toFixed(4)}°`
    ]);
  }
  
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: metadataInfo,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' }
    }
  });
  
  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  
  // Tree Species Section
  if (data.metadata.simulation?.selectedTrees && data.metadata.simulation.selectedTrees.length > 0) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Selected Tree Species', 14, yPos);
    yPos += 8;
    
    const treeData = data.metadata.simulation.selectedTrees.map((tree: { name: string; scientificName: string }) => {
      const percentage = data.metadata.simulation?.treePercentages?.[tree.name.toLowerCase().replace(/\s+/g, '-')] || 0;
      return [
        tree.name,
        tree.scientificName,
        `${percentage.toFixed(1)}%`
      ];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [['Common Name', 'Scientific Name', 'Percentage']],
      body: treeData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
    });
    
    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }
  
  // Check if we need a new page
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  // Impact Results Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Environmental Impact Analysis', 14, yPos);
  yPos += 8;
  
  const impactData = [
    ['Carbon Sequestration', `${data.impactResults.carbonSequestration?.toFixed(2) || 'N/A'} kg CO₂/year`],
    ['Total Carbon Impact', `${data.impactResults.totalCarbon?.toFixed(2) || 'N/A'} kg CO₂`],
    ['Biodiversity Impact', `${data.impactResults.biodiversityImpact?.toFixed(1) || 'N/A'}/5`],
    ['Average Biodiversity', `${data.impactResults.averageBiodiversity?.toFixed(1) || 'N/A'}/5`],
    ['Forest Resilience', `${data.impactResults.forestResilience?.toFixed(1) || 'N/A'}/5`],
    ['Average Resilience', `${data.impactResults.averageResilience?.toFixed(1) || 'N/A'}/5`],
    ['Water Retention', `${data.impactResults.waterRetention?.toFixed(0) || 'N/A'}%`],
    ['Air Quality Improvement', `${data.impactResults.airQualityImprovement?.toFixed(0) || 'N/A'}%`],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: impactData,
    theme: 'striped',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { cellWidth: 'auto' }
    }
  });
  
  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  
  // Environmental Data Section
  if (data.environmentalData && Object.keys(data.environmentalData).length > 0) {
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Environmental Conditions', 14, yPos);
    yPos += 8;
    
    const envData: string[][] = [];
    
    if (data.environmentalData.soil) {
      envData.push([
        'Soil Carbon Content',
        data.environmentalData.soil.carbon 
          ? `${data.environmentalData.soil.carbon.toFixed(1)} g/kg` 
          : 'Not available'
      ]);
      envData.push([
        'Soil pH',
        data.environmentalData.soil.ph 
          ? data.environmentalData.soil.ph.toFixed(1)
          : 'Not available'
      ]);
    }
    
    if (data.environmentalData.climate) {
      envData.push([
        'Temperature',
        data.environmentalData.climate.temperature 
          ? `${data.environmentalData.climate.temperature.toFixed(1)}°C`
          : 'Estimated from latitude'
      ]);
      envData.push([
        'Precipitation',
        data.environmentalData.climate.precipitation 
          ? `${data.environmentalData.climate.precipitation.toFixed(1)} mm`
          : 'Estimated from latitude'
      ]);
    }
    
    if (envData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Parameter', 'Value']],
        body: envData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { cellWidth: 'auto' }
        }
      });
      
      yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }
  }
  
  // Planting Data Section
  if (data.plantingData) {
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Forest Management Details', 14, yPos);
    yPos += 8;
    
    const plantingInfo = [
      ['Total Area', `${data.plantingData.area?.toFixed(2) || 'N/A'} hectares`],
      ['Total Trees', (data.plantingData.totalTrees || 0).toLocaleString()],
      ['Tree Spacing', `${data.plantingData.spacing?.toFixed(1) || 'N/A'} meters`],
      ['Planting Density', `${data.plantingData.density || 'N/A'} trees/hectare`],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Parameter', 'Value']],
      body: plantingInfo,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: 255 },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { cellWidth: 'auto' }
      }
    });
    
    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }
  
  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount} | Generated by Forest Impact Simulator | ${new Date().toLocaleDateString()}`,
      105,
      287,
      { align: 'center' }
    );
  }
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
  const filename = `forest_impact_report_${timestamp}.pdf`;
  
  // Download the PDF
  doc.save(filename);
}

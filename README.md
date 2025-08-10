# Forest Impact Simulator

A comprehensive tool to simulate and analyze the environmental, economic, social, and land use impact of forest planting.

## 🌟 Key Features

- **Global Map Interface**: Desktop: CTRL+click and drag, Mobile: Tap to create selection square
- **Real-time Environmental Data**: Live soil, climate, and biodiversity information with intelligent fallbacks
- **80 Tree Species Database**: Comprehensive coverage across 7 major climate zones (Tropical, Temperate, Mediterranean, Boreal, Coniferous, Arid, Subtropical)
- **Advanced Impact Simulation**: Realistic tree growth curves and climate prediction
- **Dynamic Time Analysis**: Simulate forest development over 1-100 years
- **Comprehensive Impact Analysis**: Four detailed tabs covering Environment, Economic, Social, and Land Use impacts
- **Professional Planning Tools**: Realistic planting timelines and project scale analysis
- **Export Functionality**: Download results in GeoJSON, JSON, and CSV formats

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KarimOsmanGH/forest-impact-simulator.git
   cd forest-impact-simulator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## ⚠️ Disclaimer

This simulator is for educational and planning purposes only. Use at your own risk. Always consult with forestry professionals, environmental experts, and local authorities before implementing any real-world projects.

## 📖 How to Use

1. **Select Region**: 
   - **Desktop**: CTRL+click and drag on the interactive map
   - **Mobile**: Tap to create a selection square, then drag to resize
2. **Review Data**: View automatically fetched environmental information:
   - Soil carbon content and pH
   - Current temperature and precipitation (with geographic fallbacks when unavailable)
   - Local biodiversity data
3. **Choose Trees**: Select from 80 tree species across 7 climate zones (Tropical, Temperate, Mediterranean, Boreal, Coniferous, Arid, Subtropical)
   - **Auto-recommendations**: System automatically suggests climate-appropriate species for your selected region
   - **Visual indicators**: Recommended species are marked with stars and sorted to the top
4. **Set Distribution**: For multiple trees, specify percentage distribution or use equal split
5. **Set Duration**: Adjust simulation years (1-100) using the slider
6. **Analyze Results**: Review comprehensive impacts across four tabs:
   - **Environment**: Soil data, climate data, carbon sequestration, biodiversity, and ecosystem benefits
   - **Economic**: Job creation and conservation benefits
   - **Social**: Community benefits and social impact scores
   - **Land Use**: Erosion reduction, soil improvement, and habitat creation
7. **Export Results**: Download your analysis in GeoJSON (GIS), JSON (data), or CSV (spreadsheets) format

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 15**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development

### **Mapping & Visualization**
- **Leaflet**: Interactive maps with OpenStreetMap
- **React Leaflet**: React components for Leaflet

### **Environmental APIs**
- **[ISRIC SoilGrids](https://soilgrids.org/)**: Global soil data
- **[Open-Meteo](https://open-meteo.com/)**: Weather and climate data
- **[GBIF](https://www.gbif.org/)**: Biodiversity occurrence data
- **[OpenStreetMap](https://www.openstreetmap.org/)**: Map tiles and geocoding

### **Styling & UI**
- **Tailwind CSS 4**: Utility-first CSS framework
- **Responsive Design**: Mobile-friendly interface

## 🔒 Security

This application implements comprehensive security measures to protect users and data:

- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: API calls are limited to prevent abuse
- **Content Security Policy**: XSS protection and resource restrictions
- **No Data Collection**: All processing is done client-side

For detailed security information, see [SECURITY.md](SECURITY.md).

## 🌍 Environmental Impact

The Forest Impact Simulator helps users understand the potential benefits of forest restoration by providing:

- **Data-Driven Insights**: Real environmental data from global databases
- **Quantified Impact**: Specific metrics for carbon sequestration and biodiversity
- **Real-world Comparisons**: Impact expressed in relatable terms (car emissions, flights, household electricity)
- **Long-term Planning**: Multi-decade simulation capabilities
- **Global Perspective**: Analysis for any region worldwide
- **Comprehensive Tree Database**: 80 species from all major climate zones including arid and subtropical regions

## 🧮 Calculations

### **Carbon Sequestration**

**Single Tree:**
```
Carbon = Base Rate (kg CO₂/year)
```

**Multiple Trees with Percentage Distribution:**
```
Carbon = Σ(Tree_i × Percentage_i / 100) + Soil Modifier
```

**Multiple Trees with Equal Distribution:**
```
Carbon = (Σ Tree_i) / n + Soil Modifier
```

**Environmental Modifiers:**
```
Soil Modifier = Soil Carbon (g/kg) × 0.1
```

**Real-world Comparisons:**
```
Car Emissions: Average car emits ~4.6 metric tons CO₂/year
Flight Emissions: One round-trip NY-London flight emits ~986 kg CO₂
Household Electricity: Average US household emits ~7.5 metric tons CO₂/year
```

**Realistic Growth Model:**
```
Year 1-3: Establishment phase (5-15% of mature rate)
Year 4-10: Rapid growth phase (15-80% of mature rate)
Year 11-20: Maturation phase (80-95% of mature rate)
Year 20+: Mature phase (95-100% of mature rate)
```

**Annual Carbon Calculation:**
```
Annual Carbon = Mature Rate × Growth Factor (based on year)
```

### **Climate Prediction**

**Temperature Trend Analysis:**
```
Historical Data = 11 years of temperature records
Linear Regression = Calculate temperature trend (°C/year)
Future Temperature = Current + (Trend × Years)
```

**Growth Modifier:**
```
Temperature Change = Future Temp - Current Temp
Growth Modifier = 1 + (Temperature Change × 0.02)
```

**Regional Estimates (fallback):**
```
Tropical: 25°C, Temperate: 15°C, Boreal: 5°C, Arctic: -5°C
```

**Cumulative Calculation:**
```
Total Carbon = Σ(Annual Rate × Growth Factor for each year)
```

### **Planting Timeline**

**Project Scale Classification:**
```
< 1,000 trees: Small-scale (Community/Backyard)
1,000-10,000 trees: Medium-scale (Local Restoration)
10,000-100,000 trees: Large-scale (Commercial Forestry)
100,000-1M trees: Very Large-scale (Regional Restoration)
> 1M trees: Massive-scale (National/International)
```

**Planting Rates by Scale:**
```
Small-scale: 50 trees/person/day, 2 people, 30 days/year
Medium-scale: 200 trees/person/day, 5 people, 60 days/year
Large-scale: 500 trees/person/day, 10 people, 90 days/year
Very Large-scale: 800 trees/person/day, 25 people, 120 days/year
Massive-scale: 1,000 trees/person/day, 50 people, 150 days/year
```

### **Biodiversity Impact**

**Base Calculation:**
```
Biodiversity = Σ(Tree_i × Percentage_i / 100) + Local Enhancement
```

**Local Enhancement:**
```
Local Enhancement = 0.2 (if local species detected)
Final Biodiversity = min(Biodiversity, 5.0)
```

### **Forest Resilience**

**Base Calculation:**
```
Resilience = Σ(Tree_i × Percentage_i / 100) + Climate Factor
```

**Climate Factor:**
```
Climate Factor = Annual Precipitation (mm) × 0.001
Final Resilience = min(Resilience, 5.0)
```

### **Water Retention**

**Progressive Improvement:**
```
Base Retention = 70-85% (based on latitude)
Annual Improvement = 0.3% per year
Precipitation Bonus = Annual Precipitation (mm) × 0.01
Water Retention = min(Base + (Years × 0.3) + Bonus, 95%)
```

### **Air Quality Improvement**

**Progressive Enhancement:**
```
Base Quality = 60%
Annual Improvement = 0.7% per year
Air Quality = min(Base + (Years × 0.7), 95%)
```

### **Mathematical Notation**

- **Σ**: Summation across all selected tree species
- **Tree_i**: Carbon sequestration rate of tree species i
- **Percentage_i**: User-specified percentage for tree species i
- **n**: Number of selected tree species
- **Years**: Simulation duration in years
- **min()**: Function returning the minimum value (capping at maximum)

## 📚 Data Sources & References

### **Carbon Sequestration**
- Default value of 25 kg CO₂/year per mature tree based on [IPCC Fourth Assessment Report](https://www.ipcc.ch/report/ar4/wg1/)
- Rates vary by species, age, and local conditions
- Peer-reviewed studies support these estimates

### **Environmental Data**
- **[ISRIC SoilGrids](https://soilgrids.org/)**: Global soil information
- **[Open-Meteo](https://open-meteo.com/)**: Climate and weather data
- **[GBIF](https://www.gbif.org/)**: Biodiversity occurrence records

## 🤝 Contributing

We welcome contributions! This project is open source because environmental knowledge belongs to everyone.

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Areas for Contribution
- Additional tree species and climate zones
- Enhanced visualization features
- Improved calculation algorithms
- Mobile app development
- Documentation improvements
- Security enhancements
- Additional environmental data sources
- Real-world comparison metrics

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[ISRIC SoilGrids](https://soilgrids.org/)** for global soil data
- **[Open-Meteo](https://open-meteo.com/)** for climate information
- **[GBIF](https://www.gbif.org/)** for biodiversity data
- **[OpenStreetMap](https://www.openstreetmap.org/)** for map tiles
- **[Leaflet](https://leafletjs.com/)** for interactive mapping

## 📞 Contact

- **Developer**: [Karim Osman](https://kar.im)
- **Project**: [Forest Impact Simulator](https://github.com/KarimOsmanGH/forest-impact-simulator)
- **Issues**: [GitHub Issues](https://github.com/KarimOsmanGH/forest-impact-simulator/issues)

---





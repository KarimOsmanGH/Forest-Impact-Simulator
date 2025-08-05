# Forest Impact Simulator <img src="/favicon.svg" alt="Forest Impact Simulator" width="24" height="24" style="display: inline-block; vertical-align: middle;" />

A tool to simulate and analyze the environmental impact of forest planting.

## ✨ Features

### 🗺️ **Interactive Location Selection**
- **Global Map Interface**: Click anywhere on the world map to select locations
- **Precise Coordinates**: Real-time latitude and longitude display
- **Visual Markers**: Clear pin markers for selected locations
- **Area Selection**: Drag to select regions for larger area analysis
- **Selected Region Display**: View area coordinates and center point within the simulator

### 🌍 **Real-time Environmental Data**
- **Soil Analysis**: Carbon content and pH levels from ISRIC SoilGrids
- **Climate Information**: Temperature and precipitation from Open-Meteo
- **Biodiversity Data**: Local species information from GBIF
- **Automatic Fetching**: Instant environmental data for any location

### 📊 **Advanced Impact Simulation**
- **Carbon Sequestration**: Calculate annual and cumulative CO₂ absorption
- **Real-world Comparisons**: See impact in terms of car emissions, flights, and household electricity
- **Biodiversity Enhancement**: Assess ecosystem improvement potential
- **Forest Resilience**: Evaluate climate adaptation capabilities
- **Water Management**: Analyze hydrological benefits
- **Air Quality**: Measure atmospheric improvement effects
- **Weighted Averages**: Accurate calculations for mixed-species forests

### ⏰ **Dynamic Time Analysis**
- **Flexible Duration**: Simulate impacts from 1 to 100 years
- **Cumulative Metrics**: View both annual rates and long-term totals
- **Real-time Updates**: Instant recalculation with parameter changes

### 🌳 **Comprehensive Tree Database**
- **60 Tree Species**: Extensive collection from all major climate zones
- **5 Categories**: Deciduous, Coniferous, Tropical, Mediterranean, and Boreal trees
- **Climate Matching**: Automatic recommendations based on location and latitude
- **Growth Characteristics**: Detailed information on each species
- **Carbon Efficiency**: Compare sequestration rates across species
- **Percentage Distribution**: Set custom percentages for mixed forests (e.g., 60% Oak, 40% Pine)
- **Equal Split Option**: Quick equal distribution for balanced forest compositions
- **Boreal Trees**: Specialized northern forest species (Black Spruce, White Spruce, Balsam Fir, Tamarack, Jack Pine)
- **Unique Species**: Rare trees like Monkey Puzzle and Dragon Blood Tree

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/karimosmanGH/Forest-Impact-Simulator.git
   cd Forest-Impact-Simulator
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

1. **Select Location**: Click on the interactive map to choose your forest location or drag to select a region
2. **Review Data**: View automatically fetched environmental information:
   - Soil carbon content and pH
   - Current temperature and precipitation
   - Local biodiversity data
3. **Choose Trees**: Select from 60 tree species across 5 categories (Deciduous, Coniferous, Tropical, Mediterranean, Boreal)
4. **Set Distribution**: For multiple trees, specify percentage distribution or use equal split
5. **Set Duration**: Adjust simulation years (1-100) using the slider
6. **Analyze Results**: Review annual and cumulative environmental impacts with real-world comparisons

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
- **Global Perspective**: Analysis for any location worldwide
- **Comprehensive Tree Database**: 60 species from all major climate zones

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
Year 1: 5% of mature rate
Year 2: 15% of mature rate
Year 3: 30% of mature rate
Year 4: 50% of mature rate
Year 5: 70% of mature rate
Year 6: 85% of mature rate
Year 7+: 95% of mature rate (approaching full maturity)
```

**Cumulative Calculation:**
```
Total Carbon = Σ(Annual Rate × Growth Factor for each year)
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
- Default value of 25 kg CO₂/year per mature tree based on IPCC Fourth Assessment Report
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
- **Project**: [Forest Impact Simulator](https://github.com/karimosmanGH/Forest-Impact-Simulator)
- **Issues**: [GitHub Issues](https://github.com/karimosmanGH/Forest-Impact-Simulator/issues)

---





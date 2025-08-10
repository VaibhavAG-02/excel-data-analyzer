# Contributing to Excel Data Analyzer

Thank you for your interest in contributing to Excel Data Analyzer! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
- **Search existing issues** before creating a new one
- **Use clear, descriptive titles** for bug reports or feature requests
- **Include steps to reproduce** for bugs
- **Specify browser and version** if relevant

### Suggesting Enhancements
- **Check if the enhancement has been suggested before**
- **Explain why this enhancement would be useful**
- **Provide detailed description** of the proposed functionality

### Pull Requests
1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Test thoroughly** in multiple browsers
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

## 🔧 Development Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Text editor (VS Code, Sublime Text, etc.)
- Basic knowledge of HTML, CSS, and JavaScript

### Local Development
```bash
# Clone your fork
git clone https://github.com/your-username/excel-data-analyzer.git
cd excel-data-analyzer

# No build process needed - open directly in browser
open index.html

# Or use a local server (recommended)
python -m http.server 8000
# Then visit http://localhost:8000
```

### Project Structure
```
excel-data-analyzer/
├── index.html          # Main application page
├── style.css           # Application styling
├── app.js              # Core application logic
├── README.md           # Project documentation
├── LICENSE             # MIT License
└── docs/
    ├── DEPLOYMENT.md   # Deployment guide
    └── CONTRIBUTING.md # This file
```

## 📝 Coding Standards

### HTML
- Use semantic HTML5 elements
- Ensure accessibility compliance (ARIA labels, alt text)
- Validate markup using W3C validator

### CSS
- Follow BEM methodology for class naming
- Use CSS custom properties (variables) for theming
- Ensure responsive design for all screen sizes
- Test in all supported browsers

### JavaScript
- Use ES6+ features where supported
- Follow consistent naming conventions (camelCase)
- Add comments for complex logic
- Handle errors gracefully with user-friendly messages

### Code Style
```javascript
// Good: Clear variable names and comments
const processExcelFile = (file) => {
    // Validate file type before processing
    if (!isValidExcelFile(file)) {
        throw new Error('Invalid file type');
    }
    
    return parseWorkbook(file);
};

// Good: Error handling
try {
    const data = processExcelFile(uploadedFile);
    displayResults(data);
} catch (error) {
    showErrorMessage(error.message);
}
```

## 🧪 Testing

### Manual Testing
Before submitting a pull request, test your changes:

1. **File Upload**: Test with various Excel files (.xlsx, .xls)
2. **Analysis**: Verify statistical calculations are accurate
3. **Visualizations**: Ensure charts render correctly
4. **Export**: Test CSV download functionality
5. **Error Handling**: Test with invalid files
6. **Browser Compatibility**: Test in Chrome, Firefox, Safari, Edge
7. **Responsive Design**: Test on mobile and tablet devices

### Test Cases
```javascript
// Example test scenarios to verify
const testScenarios = [
    {
        file: 'sample-data.xlsx',
        expectedColumns: 5,
        expectedRows: 100,
        expectedMean: 25.5
    },
    {
        file: 'empty-file.xlsx',
        expectedError: 'Empty file detected'
    }
];
```

## 📊 Feature Areas

### Priority Areas for Contribution
1. **Analysis Features**
   - Additional statistical methods
   - Advanced data quality checks
   - Custom analysis configurations

2. **Visualizations**
   - New chart types
   - Interactive features
   - Export options

3. **User Experience**
   - Accessibility improvements
   - Mobile optimization
   - Performance enhancements

4. **File Support**
   - Additional formats (CSV, JSON)
   - Large file handling
   - Memory optimization

## 🐛 Bug Reports

### Good Bug Report Structure
```markdown
**Bug Description**
Brief description of the issue

**Steps to Reproduce**
1. Upload file X
2. Click on Y
3. Observe error Z

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- Browser: Chrome 120
- OS: Windows 11
- File size: 5MB
- File type: .xlsx
```

## ✨ Feature Requests

### Good Feature Request Structure
```markdown
**Feature Description**
Clear description of the proposed feature

**Use Case**
Why this feature would be valuable

**Proposed Solution**
How you envision this working

**Alternatives Considered**
Other approaches you've thought about
```

## 📚 Resources

### Documentation
- [MDN Web Docs](https://developer.mozilla.org/) - Web development reference
- [SheetJS Documentation](https://docs.sheetjs.com/) - Excel processing library
- [Chart.js Documentation](https://www.chartjs.org/docs/) - Visualization library

### Tools
- [VS Code](https://code.visualstudio.com/) - Recommended editor
- [Browser Dev Tools](https://developer.chrome.com/docs/devtools/) - Debugging
- [Accessibility Checker](https://www.webaccessibility.com/) - A11y testing

## 🎯 Contribution Guidelines

### Do's
✅ **Follow existing code style and patterns**  
✅ **Test your changes thoroughly**  
✅ **Update documentation if needed**  
✅ **Write clear commit messages**  
✅ **Be respectful in discussions**  

### Don'ts
❌ **Don't break existing functionality**  
❌ **Don't submit untested code**  
❌ **Don't ignore accessibility**  
❌ **Don't add unnecessary dependencies**  

## 🏆 Recognition

Contributors are recognized in:
- GitHub contributors list
- README.md acknowledgments
- Release notes for significant contributions

## 📞 Getting Help

- **GitHub Issues**: Technical questions and bug reports
- **GitHub Discussions**: General questions and ideas
- **Documentation**: Check existing docs first

## 📜 License

By contributing to Excel Data Analyzer, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Excel Data Analyzer! 🙏
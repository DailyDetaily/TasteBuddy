const { HomeRegular } = require('@fluentui/react-icons');
import('react-dom/server').then(ReactDOMServer => {
  const React = require('react');
  console.log(ReactDOMServer.renderToString(React.createElement(HomeRegular, { size: 24, className: 'foo', style: { width: 20} })));
});

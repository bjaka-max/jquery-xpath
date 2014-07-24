/*
 * jQuery XPath plugin (with full XPath 2.0 language support)
 *
 * Copyright (c) 2013 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 *
 *
 */

var cHTMLDocument	= window.HTMLDocument,
	cQuery		= window.jQuery,
	oDocument	= window.document,
	bOldMS	= !!oDocument.namespaces && !oDocument.createElementNS,	// Internet Explorer 8 or older
	bOldW3	= !bOldMS && oDocument.documentElement.namespaceURI != "http://www.w3.org/1999/xhtml";

// Create two separate HTML and XML contexts
var oHTMLStaticContext	= new cStaticContext,
	oXMLStaticContext	= new cStaticContext;

// Initialize HTML context (this has default xhtml namespace)
oHTMLStaticContext.baseURI	= oDocument.location.href;
oHTMLStaticContext.defaultFunctionNamespace	= "http://www.w3.org/2005/xpath-functions";
oHTMLStaticContext.defaultElementNamespace	= "http://www.w3.org/1999/xhtml";

// Initialize XML context (this has default element null namespace)
oXMLStaticContext.defaultFunctionNamespace	= oHTMLStaticContext.defaultFunctionNamespace;

//
function fXPath_evaluate(oQuery, sExpression, fNSResolver) {
	// Return empty jQuery object if expression missing
	if (typeof sExpression == "undefined" || sExpression === null)
		sExpression	= '';

	// Check if context specified
	var oNode	= oQuery[0];
	if (typeof oNode == "undefined")
		oNode	= null;

	// Choose static context
	var oStaticContext	= oNode && (oNode.nodeType == 9 ? oNode : oNode.ownerDocument).createElement("div").tagName == "DIV" ? oHTMLStaticContext : oXMLStaticContext;

	// Set static context's resolver
	oStaticContext.namespaceResolver	= fNSResolver;

	// Create expression tree
	var oExpression	= new cExpression(cString(sExpression), oStaticContext);

	// Reset static context's resolver
	oStaticContext.namespaceResolver	= null;

	// Evaluate expression
	var aSequence,
		oSequence	= new cQuery,
		oAdapter	= oL2DOMAdapter;

	// Determine which DOMAdapter to use based on browser and DOM type
	if (bOldMS)
		oAdapter	= oStaticContext == oHTMLStaticContext ? oMSHTMLDOMAdapter : oMSXMLDOMAdapter;
	else
	if (bOldW3 && oStaticContext == oHTMLStaticContext)
		oAdapter	= oL2HTMLDOMAdapter;

	// Evaluate expression tree
	aSequence	= oExpression.evaluate(new cDynamicContext(oStaticContext, oNode, null, oAdapter));
	for (var nIndex = 0, nLength = aSequence.length, oItem; nIndex < nLength; nIndex++)
		oSequence.push(oAdapter.isNode(oItem = aSequence[nIndex]) ? oItem : cStaticContext.xs2js(oItem));

	return oSequence;
};
function getElementXPath(oQuery) {
	var element = oQuery.get(0);
    if (element && element.id)
        return '//*[@id="' + element.id + '"]';
    else
        return this.getElementTreeXPath(element);
};

function getElementTreeXPath(element) {
    var paths = [];

    // Use nodeName (instead of localName) so namespace prefix is included (if any).
    for (; element && element.nodeType == 1; element = element.parentNode)
    {
        var index = 0;
        for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling)
        {
            // Ignore document type declaration.
            if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
                continue;

            if (sibling.nodeName == element.nodeName)
                ++index;
        }

        var tagName = element.nodeName.toLowerCase();
        var pathIndex = (index ? "[" + (index+1) + "]" : "");
        paths.splice(0, 0, tagName + pathIndex);
    }

    return paths.length ? "/" + paths.join("/") : null;
};

// Extend jQuery
var oObject	= {};
oObject.xpath	= function(oQuery, sExpression, fNSResolver) {
	return fXPath_evaluate(oQuery instanceof cQuery ? oQuery : new cQuery(oQuery), sExpression, fNSResolver);
};
oObject.getXpath = function(oQuery) {
	return getElementXPath(oQuery instanceof cQuery ? oQuery : new cQuery(oQuery));
};
cQuery.extend(cQuery, oObject);

oObject	= {};
oObject.xpath	= function(sExpression, fNSResolver) {
	return fXPath_evaluate(this, sExpression, fNSResolver);
};
oObject.getXpath = function() {
	return getElementXPath(this);
};
cQuery.extend(cQuery.prototype, oObject);

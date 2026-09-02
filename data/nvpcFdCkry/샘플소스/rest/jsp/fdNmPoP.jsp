<%@page import="java.io.InputStream"%>
<%@page import="java.net.URLEncoder"%>
<%@page import="org.w3c.dom.NodeList"%>
<%@page import="org.w3c.dom.Node"%>
<%@page import="org.w3c.dom.Element"%>
<%@page import="javax.xml.parsers.DocumentBuilderFactory"%>
<%@page import="org.w3c.dom.Document"%>
<%@page import="java.net.URL"%>

<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
</head>
<body>
<%
//향토음식 IPC
if(request.getParameter("type")!=null && !request.getParameter("type").equals("") && request.getParameter("type").equals("1")){
	//apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
	String apiKey="발급받은인증키를삽입하세요";
	//서비스 명
	String serviceName="nvpcFdCkry";
	//오퍼레이션 명
	String operationName="clIpcCodeInfo";

	String parameter = "/"+serviceName+"/"+operationName;
	parameter += "?apiKey="+ apiKey;
	parameter += "&code="+request.getParameter("dNo");
	String nm = request.getParameter("nm");
	//리스트 서버와 통신
	URL listApiUrl = new URL("http://api.nongsaro.go.kr/service"+parameter);
	InputStream listApiStream = listApiUrl.openStream();

	Document listDoc = null;
	try{
		//xml document
		listDoc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(listApiStream);
	}catch(Exception e){
		e.printStackTrace();
	}finally{
		listApiStream.close();
	}

	int listSize = 0;

	NodeList listItems = null;
	NodeList codeNms = null;//번호
	NodeList codeDcs = null;//요소명


	listItems = listDoc.getElementsByTagName("item");
	listSize = listDoc.getElementsByTagName("item").getLength();

	codeNms = listDoc.getElementsByTagName("codeNm");
	codeDcs = listDoc.getElementsByTagName("codeDc");

	if(listSize==0){
%>
	<h3><font color='red'>조회한 정보가 없습니다.</font></h3>
<%
	}else{
%>
<h4><strong> * 샘플화면은 디자인을 적용하지 않았으니, 개별 사이트의 스타일에 맞게 코딩하시기 바랍니다.</strong></h4>
<h3><strong>향토음식 IPC</strong></h3><hr>
	<table width="100%" border="1" cellSpacing="0" cellPadding="0">
		<colgroup>
			<col style="width:25%;"/>
			<col/>
		</colgroup>
		<tr>
			<td>IPC</td>
			<td><%=nm%></td>
		</tr>

<%
		for(int i=0; i<listSize; i++){
			String codeNm = codeNms.item(i).getFirstChild() == null ? "" : codeNms.item(i).getFirstChild().getNodeValue();
			String codeDc = codeDcs.item(i).getFirstChild() == null ? "" : codeDcs.item(i).getFirstChild().getNodeValue();
%>
		<tr>
   			<td>
<%			if(codeNm.length()==1){out.print("섹션<br />(Section)");}
   			else if(codeNm.length()==3){out.print("클래스<br />(Class)");}
   			else if(codeNm.length()==4){out.print("서브클래스<br />(SubClass)");}
%>
   			</td>
   			<td><%=codeNm%><%=codeDc%></td>
		</tr>
<%
		}
%>
	</table>
<%
	}
}
%>

<%
//향토음식 고문헌
if(request.getParameter("type")!=null && !request.getParameter("type").equals("") && request.getParameter("type").equals("2")){
	//apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
	String apiKey="발급받은인증키를삽입하세요";
	//서비스 명
	String serviceName="nvpcFdCkry";
	//오퍼레이션 명
	String operationName="oldLtrtreInfo";

	String parameter = "/"+serviceName+"/"+operationName;
	parameter += "?apiKey="+ apiKey;
	parameter += "&code="+request.getParameter("dNo");

	//리스트 서버와 통신
	URL listApiUrl = new URL("http://api.nongsaro.go.kr/service"+parameter);
	InputStream listApiStream = listApiUrl.openStream();

	Document listDoc = null;
	try{
		//xml document
		listDoc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(listApiStream);
	}catch(Exception e){
		e.printStackTrace();
	}finally{
		listApiStream.close();
	}

	int listSize = 0;

	NodeList listItems = null;

	NodeList oldLtrtreNms = null;//
	NodeList pblctDes = null;//
	NodeList pgeCos = null;//
	NodeList authrs = null;//
	NodeList plscmpnNms = null;//
	NodeList originInsttNms = null;//
	NodeList sumryCns = null;//

	listItems = listDoc.getElementsByTagName("item");
	listSize = listDoc.getElementsByTagName("item").getLength();

	oldLtrtreNms = listDoc.getElementsByTagName("oldLtrtreNm");
	pblctDes = listDoc.getElementsByTagName("pblctDe");
	pgeCos = listDoc.getElementsByTagName("pgeCo");
	authrs = listDoc.getElementsByTagName("authr");
	plscmpnNms = listDoc.getElementsByTagName("plscmpnNm");
	originInsttNms = listDoc.getElementsByTagName("originInsttNm");
	sumryCns = listDoc.getElementsByTagName("sumryCn");

	if(listSize==0){
%>
	<h3>조회한 정보가 없습니다.</h3>
<%
	}else{
%>
<h4><strong> * 샘플화면은 디자인을 적용하지 않았으니, 개별 사이트의 스타일에 맞게 코딩하시기 바랍니다.</strong></h4>
<h3><strong>고문헌정보</strong></h3><hr>
	<table width="100%" border="1" cellSpacing="0" cellPadding="0">
		<colgroup>
			<col style="width:20%;"/>
			<col />
		</colgroup>
<%
		for(int i=0; i<listSize; i++){
			String oldLtrtreNm = oldLtrtreNms.item(i).getFirstChild() == null ? "" : oldLtrtreNms.item(i).getFirstChild().getNodeValue();
			String pblctDe = pblctDes.item(i).getFirstChild() == null ? "" : pblctDes.item(i).getFirstChild().getNodeValue();
			String pgeCo = pgeCos.item(i).getFirstChild() == null ? "" : pgeCos.item(i).getFirstChild().getNodeValue();
			String authr = authrs.item(i).getFirstChild() == null ? "" : authrs.item(i).getFirstChild().getNodeValue();
			String plscmpnNm = plscmpnNms.item(i).getFirstChild() == null ? "" : plscmpnNms.item(i).getFirstChild().getNodeValue();
			String originInsttNm = originInsttNms.item(i).getFirstChild() == null ? "" : originInsttNms.item(i).getFirstChild().getNodeValue();
			String sumryCn = sumryCns.item(i).getFirstChild() == null ? "" : sumryCns.item(i).getFirstChild().getNodeValue();
%>
		<tr>
   			<td>고문헌 명</td>
   			<td><%=oldLtrtreNm%></td>
   		</tr>
   		<tr>
   			<td>발행연도</td>
   			<td><%=pblctDe%></td>
   		</tr>
   		<tr>
   			<td>전체페이지수</td>
   			<td><%=pgeCo%></td>
   		</tr>
   		<tr>
   			<td>저자명</td>
   			<td><%=authr%></td>
   		</tr>
   		<tr>
   			<td>출판사</td>
   			<td><%=plscmpnNm%></td>
   		</tr>
   		<tr>
   			<td>원본소장기관</td>
   			<td><%=originInsttNm%></td>
   		</tr>
   		<tr>
   			<td>주요내용</td>
   			<td><%=sumryCn.replaceAll("&lt;", "").replaceAll("&gt;", "").replaceAll("br", "")%></td>
   		</tr>
<%
		}
%>
	</table>
<%
	}
}
%>
</body>
</html>
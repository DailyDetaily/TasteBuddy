<% @CODEPAGE="65001" language="VBScript" %>
<html>
<head>
<meta http-dquiv="Content-Type" content="text/html" charset="utf-8">
</head>
<body>
<h4><strong> * 샘플화면은 디자인을 적용하지 않았으니, 개별 사이트의 스타일에 맞게 코딩하시기 바랍니다.</strong></h4>
<%
'향토음식 IPC
If Not Request("type") Is Nothing And Request("type") <> "" And Request("type") = "1" Then
	'apiKey - 농사로 Open API에서 신청 후 승인되면 확인가능
	apiKey = "발급받은인증키를삽입하세요"
	'서비스 명
	serviceName = "nvpcFdCkry"
	'오퍼레이션 명
	operationName = "clIpcCodeInfo"

	'XML 받을 URL 생성
	parameter = "/" & serviceName & "/" & operationName
	parameter = parameter & "?apiKey=" & apiKey
	parameter = parameter & "&code=" & Request("dNo")

	nm = Request("nm")

	targetURL = "http://api.nongsaro.go.kr/service" & parameter

	'농사로 Open API 통신 시작
	Set xmlHttp = Server.CreateObject("Microsoft.XMLHTTP")
	xmlHttp.Open "GET", targetURL, False
	xmlHttp.Send


	Set oStream = CreateObject("ADODB.Stream")
	oStream.Open
	oStream.Position = 0
	oStream.Type = 1
	oStream.Write xmlHttp.ResponseBody
	oStream.Position = 0
	oStream.Type = 2
	oStream.Charset = "utf-8"
	sText = oStream.ReadText
	oStream.Close

	Set xmlDOM = server.CreateObject("MSXML.DOMDOCUMENT")
	xmlDOM.async = False
	xmlDOM.LoadXML sText
	'농사 Open API 통신 끝

	Set listItem = xmlDOM.SelectNodes("//items")
	cnt = listItem(0).childNodes.length
	Set items = listItem(0).childNodes

	If cnt = 0 Then
		Response.Write("<h3><font color='red'>조회한 정보가 없습니다.</font></h3>")
	Else
%>
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
	For i=0 To cnt-1
		   Set itemNode = items.item(i)
			If NOT itemNode Is Nothing Then
				'코드명
				If NOT itemNode.SelectSingleNode("codeNm") is Nothing Then
					codeNm = itemNode.SelectSingleNode("codeNm").text
				End If
				'코드설명
				If NOT itemNode.SelectSingleNode("codeDc") is Nothing Then
					codeDc = itemNode.SelectSingleNode("codeDc").text
				End If
			End If
%>
		<tr>
   			<td>
<%			If Len(codeNm) = 1 Then Response.Write("섹션<br />(Section)") End If
   			If Len(codeNm) = 3 Then Response.Write("클래스<br />(Class)") End If
   			If Len(codeNm) = 4 Then Response.Write("서브클래스<br />(SubClass)") End If
%>

   			</td>
   			<td><%=codeNm%><%=codeDc%></td>
   		</tr>
<%
			Set itemNode = Nothing
		Next
		Response.Write("</table>")
	End If
End If
%>

<%
'고문헌
If Not Request("type") Is Nothing And Request("type") <> "" And Request("type") = "2" Then
	'apiKey - 농사로 Open API에서 신청 후 승인되면 확인가능
	apiKey = "발급받은인증키를삽입하세요"
	'서비스 명
	serviceName = "nvpcFdCkry"
	'오퍼레이션 명
	operationName = "oldLtrtreInfo"

	'XML 받을 URL 생성
	parameter = "/" & serviceName & "/" & operationName
	parameter = parameter & "?apiKey=" & apiKey
	parameter = parameter & "&code=" & Request("dNo")

	targetURL = "http://api.nongsaro.go.kr/service" & parameter

	'농사로 Open API 통신 시작
	Set xmlHttp = Server.CreateObject("Microsoft.XMLHTTP")
	xmlHttp.Open "GET", targetURL, False
	xmlHttp.Send

	Set oStream = CreateObject("ADODB.Stream")
	oStream.Open
	oStream.Position = 0
	oStream.Type = 1
	oStream.Write xmlHttp.ResponseBody
	oStream.Position = 0
	oStream.Type = 2
	oStream.Charset = "utf-8"
	sText = oStream.ReadText
	oStream.Close

	Set xmlDOM = server.CreateObject("MSXML.DOMDOCUMENT")
	xmlDOM.async = False
	xmlDOM.LoadXML sText
	'농사 Open API 통신 끝


	Set item = xmlDOM.SelectNodes("//body")
	cnt = item(0).childNodes.length

	If cnt = 0 Then
		Response.Write("<h3><font color='red'>조회한 정보가 없습니다.</font></h3>")
	Else
%>
<h3><strong>참고 문헌리스트</strong></h3><hr>
	<table width="100%" border="1" cellSpacing="0" cellPadding="0">
		<colgroup>
			<col style="width:20%;"/>
			<col />
		</colgroup>
<%

		Set oldLtrtreNm = xmlDOM.SelectNodes("//oldLtrtreNm")
		If Not oldLtrtreNm(0) Is Nothing Then oldLtrtreNmText= oldLtrtreNm(0).Text Else oldLtrtreNmText = "" End If

		Set pblctDe = xmlDOM.SelectNodes("//pblctDe")
		If Not pblctDe(0) Is Nothing Then pblctDeText= pblctDe(0).Text Else pblctDeText = "" End If

		Set pgeCo = xmlDOM.SelectNodes("//pgeCo")
		If Not pgeCo(0) Is Nothing Then pgeCoText= pgeCo(0).Text Else pgeCoText = "" End If

		Set authr = xmlDOM.SelectNodes("//authr")
		If Not authr(0) Is Nothing Then authrText= authr(0).Text Else authrText = "" End If

		Set plscmpnNm = xmlDOM.SelectNodes("//plscmpnNm")
		If Not plscmpnNm(0) Is Nothing Then plscmpnNmText= plscmpnNm(0).Text Else plscmpnNmText = "" End If

		Set originInsttNm = xmlDOM.SelectNodes("//originInsttNm")
		If Not originInsttNm(0) Is Nothing Then originInsttNmText= originInsttNm(0).Text Else originInsttNmText = "" End If

		Set sumryCn = xmlDOM.SelectNodes("//sumryCn")
		If Not sumryCn(0) Is Nothing Then sumryCnText= sumryCn(0).Text Else sumryCnText = "" End If




%>
		<tr>
   			<td>고문헌 명</td>
   			<td><%=oldLtrtreNmText%></td>
   		</tr>
   		<tr>
   			<td>발행연도</td>
   			<td><%=pblctDeText%></td>
   		</tr>
   		<tr>
   			<td>전체페이지수</td>
   			<td><%=pgeCoText%></td>
   		</tr>
   		<tr>
   			<td>저자명</td>
   			<td><%=authrText%></td>
   		</tr>
   		<tr>
   			<td>출판사</td>
   			<td><%=plscmpnNmText%></td>
   		</tr>
   		<tr>
   			<td>원본소장기관</td>
   			<td><%=originInsttNmText%></td>
   		</tr>
   		<tr>
   			<td>주요내용</td>
   			<td><%=Replace(Replace(Replace(sumryCnText,"&lt;",""),"&gt;",""),"br","")%></td>
   		</tr>
<%

		Response.Write("</table>")
	End If
End If
%>
</body>
</html>
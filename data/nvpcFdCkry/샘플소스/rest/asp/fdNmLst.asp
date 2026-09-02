<% @CODEPAGE="65001" language="VBScript" %>
<html>
<head>
<meta http-dquiv="Content-Type" content="text/html" charset="utf-8">
<title>향토음식</title>
<script type='text/javascript'>

//검색
function fncSearch(){
	with(document.searchApiForm){
		pageNo.value = "1";
		method="get";
		action = "fdNmLst.asp";
		target = "_self";
		submit();
	}
}

function fncTabChg(type){
	with(document.searchApiForm){
		pageNo.value = "1";
		if(type == 'A'){
			schType.value = type;
			schTrditfdNm2.value="";
			sidoCode.value="";
			food_type_ctg01.value="";
			food_type_ctg02.value="";
			food_type_ctg03.value="";
			food_type_ctg04.value="";
			fd_mt_ctg01.value="";
			fd_mt_ctg02.value="";
			ck_ry_ctg01.value="";
			ck_ry_ctg02.value="";
			ck_ry_ctg03.value="";
			tema_ctg01.value="";
		}else if(type == 'B'){
			schType.value = type;
			schText.value="";
			schTrditfdNm.value="";
		}else if(type == 'food_type_ctg01'){
			 food_type_ctg02.value="";
			 food_type_ctg03.value="";
			 food_type_ctg04.value="";
		}
		else if(type == 'food_type_ctg02'){
			food_type_ctg03.value="";
			food_type_ctg04.value="";
		}
		else if(type == 'food_type_ctg03'){
				food_type_ctg04.value="";
		}
		else if(type == 'fd_mt_ctg01'){
			fd_mt_ctg02.value="";
		}
		else if(type == 'ck_ry_ctg01'){
			ck_ry_ctg02.value="";
			ck_ry_ctg03.value="";
		}
		else if(type == 'ck_ry_ctg02'){
			ck_ry_ctg03.value="";
		}

		method="get";
		action = "fdNmLst.asp";
		target = "_self";
		submit();

	}
}
function fncContSearch(val){
	with(document.searchApiForm){
		pageNo.value = "1";
		schText.value = val;
		method="get";
		action = "fdNmLst.asp";
		target = "_self";
		submit();
	}
}

//페이지 이동
function fncGoPage(page){
	with(document.searchApiForm){
		pageNo.value = page;
		method="get";
		action = "fdNmLst.asp";
		target = "_self";
		submit();
	}
}

//상세
function fncView(dNo){
	with(document.searchApiForm){
		cntntsNo.value = dNo;
		method="get";
		action = "fdNmDtl.asp";
		target = "_self";
		submit();
	}
}

//팝업 띄우기
function fncListOpen(type,dNo,nm){
	var popupUrl="fdNmPoP.asp?type="+type+"&dNo="+dNo+"&nm="+nm;
	var popOption="width=800,height=440";
	window.open(popupUrl,"nongsaroPop",popOption);
}

</script>
</head>
<body>
<h4><strong> * 샘플화면은 디자인을 적용하지 않았으니, 개별 사이트의 스타일에 맞게 코딩하시기 바랍니다.</strong></h4>
<h3><strong>향토음식</strong></h3>
<hr>

<%
	'apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
	apiKey="발급받은인증키를삽입하세요"

	'서비스 명
	serviceName="nvpcFdCkry"

	'오퍼레이션 명
	operationName="fdNmLst"

	'XML 받을 URL 생성
	parameter = "/" & serviceName & "/" & operationName
	parameter = parameter & "?apiKey="&apiKey
	parameter = parameter & "&pageNo=" & Request("pageNo")

	'기본검색, 상세검색
	schType = "A"
	If Not Request("schType") Is Nothing And Request("schType") <> "" Then
		schType=Request("schType")
	End If
	parameter = parameter & "&schType=" & schType

	'초성검색
	schText = ""
	If Not Request("schText") Is Nothing And Request("schText") <> "" Then
		schText=Request("schText")
	End If
	parameter = parameter & "&schText=" & schText

	'검색 조건
	If Not Request("schTrditfdNm") Is Nothing And Request("schTrditfdNm") <> "" Then
		parameter = parameter & "&schTrditfdNm=" & Request("schTrditfdNm")
	End If

	'검색 조건
	If Not Request("schTrditfdNm2") Is Nothing And Request("schTrditfdNm2") <> "" Then
		parameter = parameter & "&schTrditfdNm2=" & Request("schTrditfdNm2")
	End If

	'검색 조건
	If Not Request("sidoCode") Is Nothing And Request("sidoCode") <> "" Then
		parameter = parameter & "&sidoCode=" & Request("sidoCode")
	End If

	'검색 조건
	If Not Request("food_type_ctg01") Is Nothing And Request("food_type_ctg01") <> "" Then
		parameter = parameter & "&food_type_ctg01=" & Request("food_type_ctg01")
	End If

	'검색 조건
	If Not Request("food_type_ctg02") Is Nothing And Request("food_type_ctg02") <> "" Then
		parameter = parameter & "&food_type_ctg02=" & Request("food_type_ctg02")
	End If

	'검색 조건
	If Not Request("food_type_ctg03") Is Nothing And Request("food_type_ctg03") <> "" Then
		parameter = parameter & "&food_type_ctg03=" & Request("food_type_ctg03")
	End If

	'검색 조건
	If Not Request("food_type_ctg04") Is Nothing And Request("food_type_ctg04") <> "" Then
		parameter = parameter & "&food_type_ctg04=" & Request("food_type_ctg04")
	End If

	'검색 조건
	If Not Request("fd_mt_ctg01") Is Nothing And Request("fd_mt_ctg01") <> "" Then
		parameter = parameter & "&fd_mt_ctg01=" & Request("fd_mt_ctg01")
	End If

	'검색 조건
	If Not Request("fd_mt_ctg02") Is Nothing And Request("fd_mt_ctg02") <> "" Then
		parameter = parameter & "&fd_mt_ctg02=" & Request("fd_mt_ctg02")
	End If

	'검색 조건
	If Not Request("ck_ry_ctg01") Is Nothing And Request("ck_ry_ctg01") <> "" Then
		parameter = parameter & "&ck_ry_ctg01=" & Request("ck_ry_ctg01")
	End If

	'검색 조건
	If Not Request("ck_ry_ctg02") Is Nothing And Request("ck_ry_ctg02") <> "" Then
		parameter = parameter & "&ck_ry_ctg02=" & Request("ck_ry_ctg02")
	End If

	'검색 조건
	If Not Request("ck_ry_ctg03") Is Nothing And Request("ck_ry_ctg03") <> "" Then
		parameter = parameter & "&ck_ry_ctg03=" & Request("ck_ry_ctg03")
	End If

	'검색 조건
	If Not Request("tema_ctg01") Is Nothing And Request("tema_ctg01") <> "" Then
		parameter = parameter & "&tema_ctg01=" & Request("tema_ctg01")
	End If

	'검색 조건
	If Not Request("order") Is Nothing And Request("order") <> "" Then
		parameter = parameter & "&order=" & Request("order")
	End If

	'검색 조건
	If Not Request("numOfRows") Is Nothing And Request("numOfRows") <> "" Then
		parameter = parameter & "&numOfRows=" & Request("numOfRows")
	End If

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

	'페이징 처리를 위한 값 받기
	'한 페이지에 제공할 건수
	Set numOfRows = xmlDOM.SelectNodes("//numOfRows")
	If Not numOfRows(0) Is Nothing Then numOfRowsText= numOfRows(0).Text Else numOfRowsText = "10" End If
	'조회할 페이지 번호
	Set pageNo = xmlDOM.SelectNodes("//pageNo")
	If Not pageNo(0) Is Nothing Then pageNoText= pageNo(0).Text Else pageNoText = "1" End If
	'조회된 총 건수
	Set totalCount = xmlDOM.SelectNodes("//totalCount")
	If Not totalCount(0) Is Nothing Then totalCountText= totalCount(0).Text Else totalCountText = "" End If


%>
	<form name="searchApiForm">
	<input type="hidden" name="pageNo" value="<%=Request("pageNo")%>">
	<input type="hidden" name="schType" value="<%=schType%>">
	<input type="hidden" name="schText" value="<%=schText%>">
	<input type="hidden" name="cntntsNo">

	<table width="100%" cellSpacing="0" cellPadding="0" border="1">
	<tr>
		<td align="center">
			<a href="javascript:fncTabChg('A');">  <% If schType = "A" Then %> <strong>기본검색</strong> <% Else  %>기본검색<% End If %> </a>
		</td>
		<td align="center">
			<a href="javascript:fncTabChg('B');">  <% If schType = "B" Then %> <strong>상세검색</strong> <% Else %>상세검색<% End If %> </a>
		</td>
	</tr>
	</table>


	<table width="100%" cellSpacing="0" cellPadding="0" border="1">
		<colgroup>
			<col style="width:10%" />
			<col/>
		</colgroup>
		<tbody>
<%
	If schType = "A" Then
%>
	<tr>
		<th>
			초성검색
		</th>
		<td>
			<div id="koreanSrch">
				<a href="#" onclick="javascript:fncContSearch('');return false;" style="font-weight:<%If schText = "" Then Response.Write("bold") End If %>">전체</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('가');return false;" style="font-weight:<%If schText = "가" Then Response.Write("bold") End If %>">가</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('나');return false;" style="font-weight:<%If schText = "나" Then Response.Write("bold") End If %>">나</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('다');return false;" style="font-weight:<%If schText = "다" Then Response.Write("bold") End If %>">다</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('라');return false;" style="font-weight:<%If schText = "라" Then Response.Write("bold") End If %>">라</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('마');return false;" style="font-weight:<%If schText = "마" Then Response.Write("bold") End If %>">마</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('바');return false;" style="font-weight:<%If schText = "바" Then Response.Write("bold") End If %>">바</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('사');return false;" style="font-weight:<%If schText = "사" Then Response.Write("bold") End If %>">사</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('아');return false;" style="font-weight:<%If schText = "아" Then Response.Write("bold") End If %>">아</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('자');return false;" style="font-weight:<%If schText = "자" Then Response.Write("bold") End If %>">자</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('차');return false;" style="font-weight:<%If schText = "차" Then Response.Write("bold") End If %>">차</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('카');return false;" style="font-weight:<%If schText = "카" Then Response.Write("bold") End If %>">카</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('타');return false;" style="font-weight:<%If schText = "타" Then Response.Write("bold") End If %>">타</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('파');return false;" style="font-weight:<%If schText = "파" Then Response.Write("bold") End If %>">파</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('하');return false;" style="font-weight:<%If schText = "하" Then Response.Write("bold") End If %>">하</a>
			</div>
		</td>
	</tr>
	<tr>
		<th>
			카테고리내 음식명
		</th>
		<td>
			<input type="text" name="schTrditfdNm" value="<%If Request("schTrditfdNm") Is Nothing Then Response.write("") Else Response.write(Request("schTrditfdNm")) End If%>">
			<input type="button" name="search" value="검색" onclick="return fncSearch();"/>
		</td>
	</tr>
	</table>
<%
	Else
%>
	<tr>
		<th>음식명</th>
		<td>
			<input type="text" name="schTrditfdNm2" value="<%If Request("schTrditfdNm2") Is Nothing Then Response.write("") Else Response.write(Request("schTrditfdNm2")) End If%>">
			<input type="button" name="search" value="검색" onclick="return fncSearch();"/>
		</td>
	</tr>
	<tr>
		<th>지역</th>
		<td>
		<select name="sidoCode">
			<option value="">선택하세요</option>
<%
		'apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
		apiKey="발급받은인증키를삽입하세요"

		'서비스 명
		serviceName="nvpcFdCkry"

		'오퍼레이션 명
		operationName="doLst"

		'XML 받을 URL 생성
		parameter = "/" & serviceName & "/" & operationName
		parameter = parameter & "?apiKey="&apiKey

		sub_targetURL = "http://api.nongsaro.go.kr/service" & parameter

		'농사로 Open API 통신 시작
		Set sub_xmlHttp = Server.CreateObject("Microsoft.XMLHTTP")
		sub_xmlHttp.Open "GET", sub_targetURL, False
		sub_xmlHttp.Send

		Set sub_oStream = CreateObject("ADODB.Stream")
		sub_oStream.Open
		sub_oStream.Position = 0
		sub_oStream.Type = 1
		sub_oStream.Write sub_xmlHttp.ResponseBody
		sub_oStream.Position = 0
		sub_oStream.Type = 2
		sub_oStream.Charset = "utf-8"
		sub_sText = sub_oStream.ReadText
		sub_oStream.Close

		Set sub_xmlDOM = server.CreateObject("MSXML.DOMDOCUMENT")
		sub_xmlDOM.async = False
		sub_xmlDOM.LoadXML sub_sText
		'농사 Open API 통신 끝

		Set sub_listItem = sub_xmlDOM.SelectNodes("//items")
		sub_cnt = sub_listItem(0).childNodes.length
		Set sub_items = sub_listItem(0).childNodes
		For i=0 To sub_cnt-1
		   Set sub_itemNode = sub_items.item(i)
			If NOT sub_itemNode Is Nothing Then
				'코드
				If NOT sub_itemNode.SelectSingleNode("code") is Nothing Then
					code = sub_itemNode.SelectSingleNode("code").text
				End If
				'코드명
				If NOT sub_itemNode.SelectSingleNode("codeNm") is Nothing Then
					codeNm = sub_itemNode.SelectSingleNode("codeNm").text
				End If
			End If
%>
			<option value="<%=code%>" <%If code = Request("sidoCode") Then Response.Write("selected") Else Response.Write("") End If%>><%=codeNm%></option>
<%
		   Set sub_itemNode = Nothing
		Next
		Response.Write("</select></td></tr>")

%>
<tr>
		<th>식품유형</th>
		<td>
		<select name="food_type_ctg01" onchange="javascript:fncTabChg('food_type_ctg01');">
			<option value="">선택하세요</option>
<%
		'apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
		apiKey="발급받은인증키를삽입하세요"

		'서비스 명
		serviceName="nvpcFdCkry"

		'오퍼레이션 명
		operationName="cmmCodeInfo"

		'XML 받을 URL 생성
		parameter = "/" & serviceName & "/" & operationName
		parameter = parameter & "?apiKey="&apiKey
		parameter = parameter & "&codeGroup=112"

		sub_targetURL = "http://api.nongsaro.go.kr/service" & parameter

		'농사로 Open API 통신 시작
		Set sub_xmlHttp = Server.CreateObject("Microsoft.XMLHTTP")
		sub_xmlHttp.Open "GET", sub_targetURL, False
		sub_xmlHttp.Send

		Set sub_oStream = CreateObject("ADODB.Stream")
		sub_oStream.Open
		sub_oStream.Position = 0
		sub_oStream.Type = 1
		sub_oStream.Write sub_xmlHttp.ResponseBody
		sub_oStream.Position = 0
		sub_oStream.Type = 2
		sub_oStream.Charset = "utf-8"
		sub_sText = sub_oStream.ReadText
		sub_oStream.Close

		Set sub_xmlDOM = server.CreateObject("MSXML.DOMDOCUMENT")
		sub_xmlDOM.async = False
		sub_xmlDOM.LoadXML sub_sText
		'농사 Open API 통신 끝

		Set sub_listItem = sub_xmlDOM.SelectNodes("//items")
		sub_cnt = sub_listItem(0).childNodes.length
		Set sub_items = sub_listItem(0).childNodes
		For i=0 To sub_cnt-1
		   Set sub_itemNode = sub_items.item(i)
			If NOT sub_itemNode Is Nothing Then
				'코드
				If NOT sub_itemNode.SelectSingleNode("code") is Nothing Then
					code = sub_itemNode.SelectSingleNode("code").text
				End If
				'코드명
				If NOT sub_itemNode.SelectSingleNode("codeNm") is Nothing Then
					codeNm = sub_itemNode.SelectSingleNode("codeNm").text
				End If
			End If
%>
			<option value="<%=code%>" <%If code = Request("food_type_ctg01") Then Response.Write("selected") Else Response.Write("") End If%>><%=codeNm%></option>
<%
		   Set sub_itemNode = Nothing
		Next
		Response.Write("</select>")
%>
		<select name="food_type_ctg02" onchange="javascript:fncTabChg('food_type_ctg02');">
			<option value="">선택하세요</option>
<%
		'apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
		apiKey="발급받은인증키를삽입하세요"

		'서비스 명
		serviceName="nvpcFdCkry"

		'오퍼레이션 명
		operationName="cmmCodeInfo"

		'XML 받을 URL 생성
		parameter = "/" & serviceName & "/" & operationName
		parameter = parameter & "?apiKey="&apiKey
		parameter = parameter & "&codeGroup=112"
		parameter = parameter & "&upperCode=" & Request("food_type_ctg01")

		sub_targetURL = "http://api.nongsaro.go.kr/service" & parameter

		'농사로 Open API 통신 시작
		Set sub_xmlHttp = Server.CreateObject("Microsoft.XMLHTTP")
		sub_xmlHttp.Open "GET", sub_targetURL, False
		sub_xmlHttp.Send

		Set sub_oStream = CreateObject("ADODB.Stream")
		sub_oStream.Open
		sub_oStream.Position = 0
		sub_oStream.Type = 1
		sub_oStream.Write sub_xmlHttp.ResponseBody
		sub_oStream.Position = 0
		sub_oStream.Type = 2
		sub_oStream.Charset = "utf-8"
		sub_sText = sub_oStream.ReadText
		sub_oStream.Close

		Set sub_xmlDOM = server.CreateObject("MSXML.DOMDOCUMENT")
		sub_xmlDOM.async = False
		sub_xmlDOM.LoadXML sub_sText
		'농사 Open API 통신 끝

		Set sub_listItem = sub_xmlDOM.SelectNodes("//items")
		sub_cnt = sub_listItem(0).childNodes.length
		Set sub_items = sub_listItem(0).childNodes
		For i=0 To sub_cnt-1
		   Set sub_itemNode = sub_items.item(i)
			If NOT sub_itemNode Is Nothing Then
				'코드
				If NOT sub_itemNode.SelectSingleNode("code") is Nothing Then
					code = sub_itemNode.SelectSingleNode("code").text
				End If
				'코드명
				If NOT sub_itemNode.SelectSingleNode("codeNm") is Nothing Then
					codeNm = sub_itemNode.SelectSingleNode("codeNm").text
				End If
			End If
%>
			<option value="<%=code%>" <%If code = Request("food_type_ctg02") Then Response.Write("selected") Else Response.Write("") End If%>><%=codeNm%></option>
<%
		   Set sub_itemNode = Nothing
		Next
		Response.Write("</select>")

%>
		<select name="food_type_ctg03" onchange="javascript:fncTabChg('food_type_ctg03');">
			<option value="">선택하세요</option>
<%
		'apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
		apiKey="발급받은인증키를삽입하세요"

		'서비스 명
		serviceName="nvpcFdCkry"

		'오퍼레이션 명
		operationName="cmmCodeInfo"

		'XML 받을 URL 생성
		parameter = "/" & serviceName & "/" & operationName
		parameter = parameter & "?apiKey="&apiKey
		parameter = parameter & "&codeGroup=112"
		parameter = parameter & "&upperCode=" & Request("food_type_ctg02")

		sub_targetURL = "http://api.nongsaro.go.kr/service" & parameter

		'농사로 Open API 통신 시작
		Set sub_xmlHttp = Server.CreateObject("Microsoft.XMLHTTP")
		sub_xmlHttp.Open "GET", sub_targetURL, False
		sub_xmlHttp.Send

		Set sub_oStream = CreateObject("ADODB.Stream")
		sub_oStream.Open
		sub_oStream.Position = 0
		sub_oStream.Type = 1
		sub_oStream.Write sub_xmlHttp.ResponseBody
		sub_oStream.Position = 0
		sub_oStream.Type = 2
		sub_oStream.Charset = "utf-8"
		sub_sText = sub_oStream.ReadText
		sub_oStream.Close

		Set sub_xmlDOM = server.CreateObject("MSXML.DOMDOCUMENT")
		sub_xmlDOM.async = False
		sub_xmlDOM.LoadXML sub_sText
		'농사 Open API 통신 끝

		Set sub_listItem = sub_xmlDOM.SelectNodes("//items")
		sub_cnt = sub_listItem(0).childNodes.length
		Set sub_items = sub_listItem(0).childNodes
		For i=0 To sub_cnt-1
		   Set sub_itemNode = sub_items.item(i)
			If NOT sub_itemNode Is Nothing Then
				'코드
				If NOT sub_itemNode.SelectSingleNode("code") is Nothing Then
					code = sub_itemNode.SelectSingleNode("code").text
				End If
				'코드명
				If NOT sub_itemNode.SelectSingleNode("codeNm") is Nothing Then
					codeNm = sub_itemNode.SelectSingleNode("codeNm").text
				End If
			End If
%>
			<option value="<%=code%>" <%If code = Request("food_type_ctg03") Then Response.Write("selected") Else Response.Write("") End If%>><%=codeNm%></option>
<%
		   Set sub_itemNode = Nothing
		Next
		Response.Write("</select>")
%>
		<select name="food_type_ctg04" onchange="javascript:fncTabChg('food_type_ctg04');">
			<option value="">선택하세요</option>
<%
		'apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
		apiKey="발급받은인증키를삽입하세요"

		'서비스 명
		serviceName="nvpcFdCkry"

		'오퍼레이션 명
		operationName="cmmCodeInfo"

		'XML 받을 URL 생성
		parameter = "/" & serviceName & "/" & operationName
		parameter = parameter & "?apiKey="&apiKey
		parameter = parameter & "&codeGroup=112"
		parameter = parameter & "&upperCode=" & Request("food_type_ctg03")


		sub_targetURL = "http://api.nongsaro.go.kr/service" & parameter

		'농사로 Open API 통신 시작
		Set sub_xmlHttp = Server.CreateObject("Microsoft.XMLHTTP")
		sub_xmlHttp.Open "GET", sub_targetURL, False
		sub_xmlHttp.Send

		Set sub_oStream = CreateObject("ADODB.Stream")
		sub_oStream.Open
		sub_oStream.Position = 0
		sub_oStream.Type = 1
		sub_oStream.Write sub_xmlHttp.ResponseBody
		sub_oStream.Position = 0
		sub_oStream.Type = 2
		sub_oStream.Charset = "utf-8"
		sub_sText = sub_oStream.ReadText
		sub_oStream.Close

		Set sub_xmlDOM = server.CreateObject("MSXML.DOMDOCUMENT")
		sub_xmlDOM.async = False
		sub_xmlDOM.LoadXML sub_sText
		'농사 Open API 통신 끝

		Set sub_listItem = sub_xmlDOM.SelectNodes("//items")
		sub_cnt = sub_listItem(0).childNodes.length
		Set sub_items = sub_listItem(0).childNodes
		For i=0 To sub_cnt-1
		   Set sub_itemNode = sub_items.item(i)
			If NOT sub_itemNode Is Nothing Then
				'코드
				If NOT sub_itemNode.SelectSingleNode("code") is Nothing Then
					code = sub_itemNode.SelectSingleNode("code").text
				End If
				'코드명
				If NOT sub_itemNode.SelectSingleNode("codeNm") is Nothing Then
					codeNm = sub_itemNode.SelectSingleNode("codeNm").text
				End If
			End If
%>
			<option value="<%=code%>" <%If code = Request("food_type_ctg04") Then Response.Write("selected") Else Response.Write("") End If%>><%=codeNm%></option>
<%
		   Set sub_itemNode = Nothing
		Next
		Response.Write("</select></td></tr>")

%>
<tr>
		<th>식재료</th>
		<td>
		<select name="fd_mt_ctg01" onchange="javascript:fncTabChg('fd_mt_ctg01');">
			<option value="">선택하세요</option>
<%
		'apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
		apiKey="발급받은인증키를삽입하세요"

		'서비스 명
		serviceName="nvpcFdCkry"

		'오퍼레이션 명
		operationName="fdMtLst"

		'XML 받을 URL 생성
		parameter = "/" & serviceName & "/" & operationName
		parameter = parameter & "?apiKey="&apiKey

		sub_targetURL = "http://api.nongsaro.go.kr/service" & parameter

		'농사로 Open API 통신 시작
		Set sub_xmlHttp = Server.CreateObject("Microsoft.XMLHTTP")
		sub_xmlHttp.Open "GET", sub_targetURL, False
		sub_xmlHttp.Send

		Set sub_oStream = CreateObject("ADODB.Stream")
		sub_oStream.Open
		sub_oStream.Position = 0
		sub_oStream.Type = 1
		sub_oStream.Write sub_xmlHttp.ResponseBody
		sub_oStream.Position = 0
		sub_oStream.Type = 2
		sub_oStream.Charset = "utf-8"
		sub_sText = sub_oStream.ReadText
		sub_oStream.Close

		Set sub_xmlDOM = server.CreateObject("MSXML.DOMDOCUMENT")
		sub_xmlDOM.async = False
		sub_xmlDOM.LoadXML sub_sText
		'농사 Open API 통신 끝

		Set sub_listItem = sub_xmlDOM.SelectNodes("//items")
		sub_cnt = sub_listItem(0).childNodes.length
		Set sub_items = sub_listItem(0).childNodes
		For i=0 To sub_cnt-1
		   Set sub_itemNode = sub_items.item(i)
			If NOT sub_itemNode Is Nothing Then
				'코드
				If NOT sub_itemNode.SelectSingleNode("code") is Nothing Then
					code = sub_itemNode.SelectSingleNode("code").text
				End If
				'코드명
				If NOT sub_itemNode.SelectSingleNode("codeNm") is Nothing Then
					codeNm = sub_itemNode.SelectSingleNode("codeNm").text
				End If
			End If
%>
			<option value="<%=code%>" <%If code = Request("fd_mt_ctg01") Then Response.Write("selected") Else Response.Write("") End If%>><%=codeNm%></option>
<%
		   Set sub_itemNode = Nothing
		Next
		Response.Write("</select>")
%>
		<select name="fd_mt_ctg02" onchange="javascript:fncTabChg('fd_mt_ctg02');">
			<option value="">선택하세요</option>
<%
		'apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
		apiKey="발급받은인증키를삽입하세요"

		'서비스 명
		serviceName="nvpcFdCkry"

		'오퍼레이션 명
		operationName="cmmCodeInfo"

		'XML 받을 URL 생성
		parameter = "/" & serviceName & "/" & operationName
		parameter = parameter & "?apiKey="&apiKey
		parameter = parameter & "&code=" & Request("fd_mt_ctg01")

		sub_targetURL = "http://api.nongsaro.go.kr/service" & parameter

		'농사로 Open API 통신 시작
		Set sub_xmlHttp = Server.CreateObject("Microsoft.XMLHTTP")
		sub_xmlHttp.Open "GET", sub_targetURL, False
		sub_xmlHttp.Send

		Set sub_oStream = CreateObject("ADODB.Stream")
		sub_oStream.Open
		sub_oStream.Position = 0
		sub_oStream.Type = 1
		sub_oStream.Write sub_xmlHttp.ResponseBody
		sub_oStream.Position = 0
		sub_oStream.Type = 2
		sub_oStream.Charset = "utf-8"
		sub_sText = sub_oStream.ReadText
		sub_oStream.Close

		Set sub_xmlDOM = server.CreateObject("MSXML.DOMDOCUMENT")
		sub_xmlDOM.async = False
		sub_xmlDOM.LoadXML sub_sText
		'농사 Open API 통신 끝

		Set sub_listItem = sub_xmlDOM.SelectNodes("//items")
		sub_cnt = sub_listItem(0).childNodes.length
		Set sub_items = sub_listItem(0).childNodes
		For i=0 To sub_cnt-1
		   Set sub_itemNode = sub_items.item(i)
			If NOT sub_itemNode Is Nothing Then
				'코드
				If NOT sub_itemNode.SelectSingleNode("code") is Nothing Then
					code = sub_itemNode.SelectSingleNode("code").text
				End If
				'코드명
				If NOT sub_itemNode.SelectSingleNode("codeNm") is Nothing Then
					codeNm = sub_itemNode.SelectSingleNode("codeNm").text
				End If
			End If
%>
			<option value="<%=code%>" <%If code = Request("fd_mt_ctg02") Then Response.Write("selected") Else Response.Write("") End If%>><%=codeNm%></option>
<%
		   Set sub_itemNode = Nothing
		Next
		Response.Write("</select></td></tr>")

%>
<tr>
		<th>조리법</th>
		<td>
		<select name="ck_ry_ctg01" onchange="javascript:fncTabChg('ck_ry_ctg01');">
			<option value="">선택하세요</option>
<%
		'apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
		apiKey="발급받은인증키를삽입하세요"

		'서비스 명
		serviceName="nvpcFdCkry"

		'오퍼레이션 명
		operationName="cmmCodeInfo"

		'XML 받을 URL 생성
		parameter = "/" & serviceName & "/" & operationName
		parameter = parameter & "?apiKey="&apiKey
		parameter = parameter & "&codeGroup=115"

		sub_targetURL = "http://api.nongsaro.go.kr/service" & parameter

		'농사로 Open API 통신 시작
		Set sub_xmlHttp = Server.CreateObject("Microsoft.XMLHTTP")
		sub_xmlHttp.Open "GET", sub_targetURL, False
		sub_xmlHttp.Send

		Set sub_oStream = CreateObject("ADODB.Stream")
		sub_oStream.Open
		sub_oStream.Position = 0
		sub_oStream.Type = 1
		sub_oStream.Write sub_xmlHttp.ResponseBody
		sub_oStream.Position = 0
		sub_oStream.Type = 2
		sub_oStream.Charset = "utf-8"
		sub_sText = sub_oStream.ReadText
		sub_oStream.Close

		Set sub_xmlDOM = server.CreateObject("MSXML.DOMDOCUMENT")
		sub_xmlDOM.async = False
		sub_xmlDOM.LoadXML sub_sText
		'농사 Open API 통신 끝

		Set sub_listItem = sub_xmlDOM.SelectNodes("//items")
		sub_cnt = sub_listItem(0).childNodes.length
		Set sub_items = sub_listItem(0).childNodes
		For i=0 To sub_cnt-1
		   Set sub_itemNode = sub_items.item(i)
			If NOT sub_itemNode Is Nothing Then
				'코드
				If NOT sub_itemNode.SelectSingleNode("code") is Nothing Then
					code = sub_itemNode.SelectSingleNode("code").text
				End If
				'코드명
				If NOT sub_itemNode.SelectSingleNode("codeNm") is Nothing Then
					codeNm = sub_itemNode.SelectSingleNode("codeNm").text
				End If
			End If
%>
			<option value="<%=code%>" <%If code = Request("ck_ry_ctg01") Then Response.Write("selected") Else Response.Write("") End If%>><%=codeNm%></option>
<%
		   Set sub_itemNode = Nothing
		Next
		Response.Write("</select>")
%>
		<select name="ck_ry_ctg02" onchange="javascript:fncTabChg('ck_ry_ctg02');">
			<option value="">선택하세요</option>
<%
		'apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
		apiKey="발급받은인증키를삽입하세요"

		'서비스 명
		serviceName="nvpcFdCkry"

		'오퍼레이션 명
		operationName="cmmCodeInfo"

		'XML 받을 URL 생성
		parameter = "/" & serviceName & "/" & operationName
		parameter = parameter & "?apiKey="&apiKey
		parameter = parameter & "&codeGroup=115"
		parameter = parameter & "&upperCode=" & Request("ck_ry_ctg01")

		sub_targetURL = "http://api.nongsaro.go.kr/service" & parameter

		'농사로 Open API 통신 시작
		Set sub_xmlHttp = Server.CreateObject("Microsoft.XMLHTTP")
		sub_xmlHttp.Open "GET", sub_targetURL, False
		sub_xmlHttp.Send

		Set sub_oStream = CreateObject("ADODB.Stream")
		sub_oStream.Open
		sub_oStream.Position = 0
		sub_oStream.Type = 1
		sub_oStream.Write sub_xmlHttp.ResponseBody
		sub_oStream.Position = 0
		sub_oStream.Type = 2
		sub_oStream.Charset = "utf-8"
		sub_sText = sub_oStream.ReadText
		sub_oStream.Close

		Set sub_xmlDOM = server.CreateObject("MSXML.DOMDOCUMENT")
		sub_xmlDOM.async = False
		sub_xmlDOM.LoadXML sub_sText
		'농사 Open API 통신 끝

		Set sub_listItem = sub_xmlDOM.SelectNodes("//items")
		sub_cnt = sub_listItem(0).childNodes.length
		Set sub_items = sub_listItem(0).childNodes
		For i=0 To sub_cnt-1
		   Set sub_itemNode = sub_items.item(i)
			If NOT sub_itemNode Is Nothing Then
				'코드
				If NOT sub_itemNode.SelectSingleNode("code") is Nothing Then
					code = sub_itemNode.SelectSingleNode("code").text
				End If
				'코드명
				If NOT sub_itemNode.SelectSingleNode("codeNm") is Nothing Then
					codeNm = sub_itemNode.SelectSingleNode("codeNm").text
				End If
			End If
%>
			<option value="<%=code%>" <%If code = Request("ck_ry_ctg02") Then Response.Write("selected") Else Response.Write("") End If%>><%=codeNm%></option>
<%
		   Set sub_itemNode = Nothing
		Next
		Response.Write("</select>")

%>
		<select name="ck_ry_ctg03" onchange="javascript:fncTabChg('ck_ry_ctg03');">
			<option value="">선택하세요</option>
<%
		'apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
		apiKey="발급받은인증키를삽입하세요"

		'서비스 명
		serviceName="nvpcFdCkry"

		'오퍼레이션 명
		operationName="cmmCodeInfo"

		'XML 받을 URL 생성
		parameter = "/" & serviceName & "/" & operationName
		parameter = parameter & "?apiKey="&apiKey
		parameter = parameter & "&codeGroup=115"
		parameter = parameter & "&upperCode=" & Request("ck_ry_ctg02")

		sub_targetURL = "http://api.nongsaro.go.kr/service" & parameter

		'농사로 Open API 통신 시작
		Set sub_xmlHttp = Server.CreateObject("Microsoft.XMLHTTP")
		sub_xmlHttp.Open "GET", sub_targetURL, False
		sub_xmlHttp.Send

		Set sub_oStream = CreateObject("ADODB.Stream")
		sub_oStream.Open
		sub_oStream.Position = 0
		sub_oStream.Type = 1
		sub_oStream.Write sub_xmlHttp.ResponseBody
		sub_oStream.Position = 0
		sub_oStream.Type = 2
		sub_oStream.Charset = "utf-8"
		sub_sText = sub_oStream.ReadText
		sub_oStream.Close

		Set sub_xmlDOM = server.CreateObject("MSXML.DOMDOCUMENT")
		sub_xmlDOM.async = False
		sub_xmlDOM.LoadXML sub_sText
		'농사 Open API 통신 끝

		Set sub_listItem = sub_xmlDOM.SelectNodes("//items")
		sub_cnt = sub_listItem(0).childNodes.length
		Set sub_items = sub_listItem(0).childNodes
		For i=0 To sub_cnt-1
		   Set sub_itemNode = sub_items.item(i)
			If NOT sub_itemNode Is Nothing Then
				'코드
				If NOT sub_itemNode.SelectSingleNode("code") is Nothing Then
					code = sub_itemNode.SelectSingleNode("code").text
				End If
				'코드명
				If NOT sub_itemNode.SelectSingleNode("codeNm") is Nothing Then
					codeNm = sub_itemNode.SelectSingleNode("codeNm").text
				End If
			End If
%>
			<option value="<%=code%>" <%If code = Request("ck_ry_ctg03") Then Response.Write("selected") Else Response.Write("") End If%>><%=codeNm%></option>
<%
		   Set sub_itemNode = Nothing
		Next
		Response.Write("</select></td></tr>")
%>
<tr>
		<th>테마</th>
		<td>
		<select name="tema_ctg01" onchange="javascript:fncTabChg('tema_ctg01');">
			<option value="">선택하세요</option>
<%
		'apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
		apiKey="발급받은인증키를삽입하세요"

		'서비스 명
		serviceName="nvpcFdCkry"

		'오퍼레이션 명
		operationName="temaLst"

		'XML 받을 URL 생성
		parameter = "/" & serviceName & "/" & operationName
		parameter = parameter & "?apiKey="&apiKey

		sub_targetURL = "http://api.nongsaro.go.kr/service" & parameter

		'농사로 Open API 통신 시작
		Set sub_xmlHttp = Server.CreateObject("Microsoft.XMLHTTP")
		sub_xmlHttp.Open "GET", sub_targetURL, False
		sub_xmlHttp.Send

		Set sub_oStream = CreateObject("ADODB.Stream")
		sub_oStream.Open
		sub_oStream.Position = 0
		sub_oStream.Type = 1
		sub_oStream.Write sub_xmlHttp.ResponseBody
		sub_oStream.Position = 0
		sub_oStream.Type = 2
		sub_oStream.Charset = "utf-8"
		sub_sText = sub_oStream.ReadText
		sub_oStream.Close

		Set sub_xmlDOM = server.CreateObject("MSXML.DOMDOCUMENT")
		sub_xmlDOM.async = False
		sub_xmlDOM.LoadXML sub_sText
		'농사 Open API 통신 끝

		Set sub_listItem = sub_xmlDOM.SelectNodes("//items")
		sub_cnt = sub_listItem(0).childNodes.length
		Set sub_items = sub_listItem(0).childNodes
		For i=0 To sub_cnt-1
		   Set sub_itemNode = sub_items.item(i)
			If NOT sub_itemNode Is Nothing Then
				'코드
				If NOT sub_itemNode.SelectSingleNode("code") is Nothing Then
					code = sub_itemNode.SelectSingleNode("code").text
				End If
				'코드명
				If NOT sub_itemNode.SelectSingleNode("codeNm") is Nothing Then
					codeNm = sub_itemNode.SelectSingleNode("codeNm").text
				End If
			End If
%>
			<option value="<%=code%>" <%If code = Request("tema_ctg01") Then Response.Write("selected") Else Response.Write("") End If%>><%=codeNm%></option>
<%
		   Set sub_itemNode = Nothing
		Next
		Response.Write("</select></td></tr></table>")

	End If

	If cnt-3 = 0 Then
		Response.Write("<h3>조회한 정보가 없습니다.</h3>")
	Else
%>
	<hr>
	<table>
	<colgroup>
		<col/>
		<col style="width:25%"/>
		<col style="width:25%"/>
		<col style="width:10%"/>
		<col style="width:10%"/>
	</colgroup>
	<tr>
		<th>이미지</th>
		<th>음식명</th>
		<th>조리법</th>
		<th>IPC</th>
		<th>고문헌</th>
	</tr>
<%
	For i=0 To cnt-4
		   Set itemNode = items.item(i)
			If NOT itemNode Is Nothing Then
				'키값
				If NOT itemNode.SelectSingleNode("cntntsNo") is Nothing Then
					cntntsNo = itemNode.SelectSingleNode("cntntsNo").text
				End If
				'파일구분코드
				If NOT itemNode.SelectSingleNode("rtnImgSeCode") is Nothing Then
					rtnImgSeCode = itemNode.SelectSingleNode("rtnImgSeCode").text
				End If
				'파일경로
				If NOT itemNode.SelectSingleNode("rtnFileCours") is Nothing Then
					rtnFileCours = itemNode.SelectSingleNode("rtnFileCours").text
				End If
				'파일명
				If NOT itemNode.SelectSingleNode("rtnStreFileNm") is Nothing Then
					rtnThumbFileNm = itemNode.SelectSingleNode("rtnThumbFileNm").text
				End If

				'음식명
				If NOT itemNode.SelectSingleNode("trditfdNm") is Nothing Then
					trditfdNm = itemNode.SelectSingleNode("trditfdNm").text
				End If
				'음식유형 풀경로
				If NOT itemNode.SelectSingleNode("foodTyCodeFullname") is Nothing Then
					foodTyCodeFullname = itemNode.SelectSingleNode("foodTyCodeFullname").text
				End If
				'지역명
				If NOT itemNode.SelectSingleNode("atptCodeNm") is Nothing Then
					atptCodeNm = itemNode.SelectSingleNode("atptCodeNm").text
				End If
				'조리법
				If NOT itemNode.SelectSingleNode("ckryCodeFullname") is Nothing Then
					ckryCodeFullname = itemNode.SelectSingleNode("ckryCodeFullname").text
				End If
				'IPC
				If NOT itemNode.SelectSingleNode("clIpcCode") is Nothing Then
					clIpcCode = itemNode.SelectSingleNode("clIpcCode").text
				End If
				'IPC명
				If NOT itemNode.SelectSingleNode("clIpcCodeNm") is Nothing Then
					clIpcCodeNm = itemNode.SelectSingleNode("clIpcCodeNm").text
				End If
				'고문헌명
				If NOT itemNode.SelectSingleNode("oldLtrtreNm") is Nothing Then
					oldLtrtreNm = itemNode.SelectSingleNode("oldLtrtreNm").text
				End If
				'고문헌코드
				If NOT itemNode.SelectSingleNode("oldLtrtreEsntlCode") is Nothing Then
					oldLtrtreEsntlCode = itemNode.SelectSingleNode("oldLtrtreEsntlCode").text
				End If
			End If

		imgCnt = -1
		rtnImgSeCodeArr= split(rtnImgSeCode,"|")
		for k=0 to UBound(rtnImgSeCodeArr)
			If rtnImgSeCodeArr(k) = "209006"  Then
				imgCnt = k
			End If
		next

		imgUrl ="http://www.nongsaro.go.kr/ps/img/common/anvil_img.jpg"

		If imgCnt > -1 Then
			rtnFileCoursArr = split(rtnFileCours,"|")
			rtnThumbFileNmArr = split(rtnThumbFileNm,"|")
			imgUrl = "http://www.nongsaro.go.kr/" & rtnFileCoursArr(imgCnt) & "/" & rtnThumbFileNmArr(imgCnt)
		Else
			for j=0 to UBound(rtnImgSeCodeArr)
				If rtnImgSeCodeArr(j) = "209007" And imgCnt = -1 Then
					imgCnt = j
				End If
			next
			If imgCnt > -1 Then
				imgUrl = "http://www.nongsaro.go.kr/"+ rtnFileCoursArr(imgCnt) +"/"+ rtnThumbFileNmArr(imgCnt)
			End If
		End If

%>
	<tr>

		<td>
			<a href="#" onclick="javascript:;fncView('<%=cntntsNo%>');">
			<img src="<%=imgUrl%>" alt=""  title="" style="width: 249px;height: 198px;"/>
			</a>
		</td>
		<td>
			<a href="#" onclick="javascript:fncView('<%=cntntsNo%>');">
			<%=trditfdNm%>
			<%
			If foodTyCodeFullname <> "" Then
%>
				[<%=foodTyCodeFullname%>]
<%
			End If
			If atptCodeNm <> "" Then
%>
				[<%=atptCodeNm%>]
<%
			Else
%>
				[상용]
<%
			End If
			%>
			</a>
		</td>
		<td><%=ckryCodeFullname%></td>
		<td>
<%
		clIpcCodeArr= split(clIpcCode,", ")
		clIpcCodeNmArr= split(clIpcCodeNm,", ")
		for l=0 to UBound(clIpcCodeArr)
			If l <> 0 Then Response.Write(",") End If
%>
		<a href="#" onclick="fncListOpen('1','<%=clIpcCodeArr(l)%>','<%=clIpcCodeNmArr(l)%>')"><%=clIpcCodeNmArr(l)%></a>
<%
		next
%>
		</td>
		<td>
<%
		oldLtrtreEsntlCodeArr= split(oldLtrtreEsntlCode,", ")
		oldLtrtreNmArr= split(oldLtrtreNm,", ")
		for m=0 to UBound(oldLtrtreEsntlCodeArr)
			If m <> 0 Then Response.Write(",") End If
%>
		<a href="#" onclick="fncListOpen('2','<%=oldLtrtreEsntlCodeArr(m)%>','')"><%=oldLtrtreNmArr(m)%></a>
<%
		next
%>
		</td>
	</tr>
<%
	Set itemNode = Nothing
	Next
	Response.Write("</table>")
End If

	'페이징 처리
	function ceil(x)

        dim temp
        temp = Round(x)
        if temp < x then
            temp = temp + 1
        end if
        ceil = temp
    end function


	pageGroupSize = 10
	pageSize = Int(numOfRowsText)


	start = Int(pageNoText)

	currentPage = Int(pageNoText)

	startRow = (currentPage - 1) * pageSize + 1
	endRow = currentPage * pageSize
	count = Int(totalCountText)
	number=0

	number=count-(currentPage-1)*pageSize

	pageGroupCount = count/(pageSize*pageGroupSize)

	numPageGroup = Int(ceil(currentPage/pageGroupSize))

	If count > 0 Then
		pageCount = Int(count / pageSize)


		If (count Mod pageSize) = 0 Then
			pageCount = pageCount + 0
		Else
			pageCount = pageCount + 1
		End If

		startPage = pageGroupSize*(numPageGroup-1)+1
		endPage = startPage + pageGroupSize-1
		prtPageNo = 0

		If endPage > pageCount Then
			endPage = pageCount
		End If

		If numPageGroup > 1 Then
			prtPageNo = (numPageGroup-2)*pageGroupSize+1
			Response.Write("<a href='javascript:fncGoPage("&prtPageNo&");'>[이전]</a>")
		End If

		i=startPage
		While i<=endPage

			prtPageNo = i
			Response.Write("<a href='javascript:fncGoPage("&prtPageNo&");'>")

			If currentPage = i Then
				Response.Write("<strong>["&i&"]</strong>")
			Else
				Response.Write("["&i&"]")
			End If

			Response.Write("</a>")

			i = i+1
		Wend

		If numPageGroup < pageGroupCount Then
			prtPageNo = (numPageGroup*pageGroupSize+1)
			Response.Write("<a href='javascript:fncGoPage("&prtPageNo&");'>[다음]</a>")
		End If
	End If
	'페이징처리 끝
%>
</body>
</html>
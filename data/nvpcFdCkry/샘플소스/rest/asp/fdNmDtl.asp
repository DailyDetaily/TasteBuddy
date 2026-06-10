<% @CODEPAGE="65001" language="VBScript" %>
<html>
<head>
<meta http-dquiv="Content-Type" content="text/html" charset="utf-8">
<title>향토음식</title>
</head>
<body>
<h4><strong> * 샘플화면은 디자인을 적용하지 않았으니, 개별 사이트의 스타일에 맞게 코딩하시기 바랍니다.</strong></h4>
<h3><strong>향토음식</strong></h3>
<hr>

<%
'향토음식 상세 조회
If Not Request("cntntsNo") Is Nothing And Request("cntntsNo") <> "" Then
	'apiKey - 농사로 Open API에서 신청 후 승인되면 확인가능
	apiKey = "발급받은인증키를삽입하세요"
	'서비스 명
	serviceName = "nvpcFdCkry"
	'오퍼레이션 명
	operationName = "fdNmDtl"

	'XML 받을 URL 생성
	parameter = "/" & serviceName & "/" & operationName
	parameter = parameter & "?apiKey="&apiKey
	parameter = parameter & "&cntntsNo=" & Request("cntntsNo")

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
		Response.Write("<h3>조회한 정보가 없습니다.</h3>")
	Else
%>
	<h2>전통향토음식 상세</h2>
	<div>
	<ul>
<%
		'음식명
		Set trditfdNm = xmlDOM.SelectNodes("//trditfdNm")
		If Not trditfdNm(0) Is Nothing Then trditfdNmText= trditfdNm(0).Text Else trditfdNmText = "" End If
		'식품유형
		Set foodTyCodeFullname = xmlDOM.SelectNodes("//foodTyCodeFullname")
		If Not foodTyCodeFullname(0) Is Nothing Then foodTyCodeFullnameText= foodTyCodeFullname(0).Text Else foodTyCodeFullnameText = "" End If
		'조리법
		Set ckryCodeFullname = xmlDOM.SelectNodes("//ckryCodeFullname")
		If Not ckryCodeFullname(0) Is Nothing Then ckryCodeFullnameText= ckryCodeFullname(0).Text Else ckryCodeFullnameText = "" End If
		'식재료
		Set fdmtInfo = xmlDOM.SelectNodes("//fdmtInfo")
		If Not fdmtInfo(0) Is Nothing Then fdmtInfoText= fdmtInfo(0).Text Else fdmtInfoText = "" End If
		'부재료
		Set asstnMatrlInfo = xmlDOM.SelectNodes("//asstnMatrlInfo")
		If Not asstnMatrlInfo(0) Is Nothing Then asstnMatrlInfoText= asstnMatrlInfo(0).Text Else asstnMatrlInfoText = "" End If
		'조리방법
		Set stdCkryDtl = xmlDOM.SelectNodes("//stdCkryDtl")
		If Not stdCkryDtl(0) Is Nothing Then stdCkryDtlText= stdCkryDtl(0).Text Else stdCkryDtlText = "" End If
		'조리시연자
		Set ckngDmprDtl = xmlDOM.SelectNodes("//ckngDmprDtl")
		If Not ckngDmprDtl(0) Is Nothing Then ckngDmprDtlText= ckngDmprDtl(0).Text Else ckngDmprDtlText = "" End If
		'참고사항
		Set referMatterDtl = xmlDOM.SelectNodes("//referMatterDtl")
		If Not referMatterDtl(0) Is Nothing Then referMatterDtlText= referMatterDtl(0).Text Else referMatterDtlText = "" End If
		'출처
		Set originDtl = xmlDOM.SelectNodes("//originDtl")
		If Not originDtl(0) Is Nothing Then originDtlText= originDtl(0).Text Else originDtlText = "" End If
		'정보제공자
		Set infoOfferInfo = xmlDOM.SelectNodes("//infoOfferInfo")
		If Not infoOfferInfo(0) Is Nothing Then infoOfferInfoText= infoOfferInfo(0).Text Else infoOfferInfoText = "" End If
		'이미지구분코드
		Set rtnImgSeCode = xmlDOM.SelectNodes("//rtnImgSeCode")
		If Not rtnImgSeCode(0) Is Nothing Then rtnImgSeCodeText= rtnImgSeCode(0).Text Else rtnImgSeCodeText = "" End If
		'이미지 경로
		Set rtnFileCours = xmlDOM.SelectNodes("//rtnFileCours")
		If Not rtnFileCours(0) Is Nothing Then rtnFileCoursText= rtnFileCours(0).Text Else rtnFileCoursText = "" End If
		'이미지 물리명
		Set rtnStreFileNm = xmlDOM.SelectNodes("//rtnStreFileNm")
		If Not rtnStreFileNm(0) Is Nothing Then rtnStreFileNmText= rtnStreFileNm(0).Text Else rtnStreFileNmText = "" End If

		rtnStreFileNmArr = split(rtnStreFileNmText,"|")
		rtnFileCoursArr = split(rtnFileCoursText,"|")
		rtnImgSeCodeArr= split(rtnImgSeCodeText,"|")

		for i=0 to UBound(rtnStreFileNmArr)
			If rtnImgSeCodeArr(i) = "209006" Then
			imgUrl = "http://www.nongsaro.go.kr/" & rtnFileCoursArr(i) & "/" & rtnStreFileNmArr(i)
%>
			<li>
				<li style="width: 33%;display: inline-block;">
				<img src="<%=imgUrl%>" alt=""  title="" style="width: 249px;height: 198px;"/>
				</li>
			</li>
<%
			End If
		next

		for i=0 to UBound(rtnStreFileNmArr)
			If rtnImgSeCodeArr(i) = "209005" or rtnImgSeCodeArr(i) = "209007" Then

				imgUrl = "http://www.nongsaro.go.kr/" & rtnFileCoursArr(i) & "/" & rtnStreFileNmArr(i)
%>
			<li>
				<li style="width: 33%;display: inline-block;">
				<img src="<%=imgUrl%>" alt=""  title="" />
				</a></li>
			</li>
<%
			End If
		next
%>
</ul>
</div>

	<div>
		<!-- 내용 -->

		<table border="1" cellSpacing="0" cellPadding="0">
			<colgroup>
				<col style="width:20%" />
				<col/>
			</colgroup>
			<tbody>
				<tr>
					<td class="txt-c">음식명</td>
					<td><%=trditfdNmText%></td>
				</tr>
				<tr>
					<td class="txt-c">식품유형</td>
					<td><%=foodTyCodeFullnameText%></td>
				</tr>
				<tr>
					<td class="txt-c">조리법</td>
					<td><%=ckryCodeFullnameText%></td>
				</tr>
				<tr>
					<td class="txt-c">식재료</td>
					<td><%=fdmtInfoText%></td>
				</tr>
				<tr>
					<td class="txt-c">부재료</td>
					<td><%=asstnMatrlInfoText%></td>
				</tr>
				<tr>
					<td class="txt-c">조리방법</td>
					<td><%=Replace(stdCkryDtlText,"\n","<br/>")%></td>
				</tr>
				<tr>
					<td class="txt-c">조리시연자</td>
					<td><%=ckngDmprDtlText%></td>
				</tr>
				<tr>
					<td class="txt-c">참고사항</td>
					<td><%=referMatterDtlText%></td>
				</tr>
				<tr>
					<td class="txt-c">출처</td>
					<td><%=originDtlText%></td>
				</tr>
				<tr>
					<td class="txt-c">정보제공자</td>
					<td><%=infoOfferInfoText%></td>
				</tr>

		</table>
		<!--// 내용 -->
	</div>
<%
	End If
End If
%>

<input type="button" onclick="javascript:location.href='fdNmLst.asp'" value="처음화면으로"/>&nbsp;
</body>
</html>